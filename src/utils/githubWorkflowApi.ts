import { GitHubActionRunItem } from '../types';
import { AndroidProjectFile } from '../data/defaultAndroidProject';

export interface GitHubRepoSettings {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
}

const STORAGE_KEY = 'android_builder_github_settings';

export function getSavedGitHubSettings(): GitHubRepoSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.owner && parsed.repo) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading saved github settings', e);
  }
  return {
    owner: 'rehmanmobilez786',
    repo: 'Android-apk-builder-GitHub-studio-',
    branch: 'main',
    token: '',
  };
}

export function saveGitHubSettings(settings: GitHubRepoSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving github settings', e);
  }
}

/**
 * Fetch Workflow Runs and Releases from GitHub
 */
export async function fetchLiveGitHubBuilds(settings: GitHubRepoSettings): Promise<{
  runs: GitHubActionRunItem[];
  releases: any[];
  error?: string;
}> {
  const { owner, repo, token } = settings;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  try {
    // 1. Fetch Workflow Runs
    const runsPromise = fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=20`,
      { headers }
    );

    // 2. Fetch Releases (which contain the real compiled APKs)
    const releasesPromise = fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=20`,
      { headers }
    );

    const [runsRes, releasesRes] = await Promise.all([runsPromise, releasesPromise]);

    if (!runsRes.ok) {
      const errText = await runsRes.text();
      return {
        runs: [],
        releases: [],
        error: `GitHub API error (${runsRes.status}): ${errText}`,
      };
    }

    const runsData = await runsRes.json();
    let releasesData: any[] = [];
    if (releasesRes.ok) {
      releasesData = await releasesRes.json();
    }

    const formattedRuns: GitHubActionRunItem[] = (runsData.workflow_runs || []).map((run: any) => {
      // Find matching release by tag or name
      const matchingRelease = releasesData.find((rel: any) => {
        const tag = rel.tag_name || '';
        const name = rel.name || '';
        return (
          tag.includes(`${run.run_number}`) ||
          name.includes(`#${run.run_number}`) ||
          (run.head_sha && rel.target_commitish === run.head_sha)
        );
      });

      let apkDownloadUrl: string | undefined = undefined;
      let apkReleaseName: string | undefined = undefined;
      let apkSize: string | undefined = undefined;

      if (matchingRelease && matchingRelease.assets && matchingRelease.assets.length > 0) {
        const apkAsset = matchingRelease.assets.find((asset: any) =>
          asset.name.toLowerCase().endsWith('.apk')
        );
        if (apkAsset) {
          apkDownloadUrl = apkAsset.browser_download_url;
          apkReleaseName = apkAsset.name;
          apkSize = (apkAsset.size / (1024 * 1024)).toFixed(1) + ' MB';
        }
      }

      return {
        id: run.id,
        name: run.name,
        run_number: run.run_number,
        status: run.status,
        conclusion: run.conclusion,
        html_url: run.html_url,
        created_at: run.created_at,
        updated_at: run.updated_at,
        head_branch: run.head_branch,
        head_sha: run.head_sha,
        event: run.event,
        display_title: run.display_title || run.name,
        actor: {
          login: run.actor?.login || 'User',
          avatar_url: run.actor?.avatar_url || 'https://github.com/github.png',
        },
        apkDownloadUrl,
        apkReleaseName,
        apkSize,
      };
    });

    return {
      runs: formattedRuns,
      releases: releasesData,
    };
  } catch (err: any) {
    return {
      runs: [],
      releases: [],
      error: err.message || 'Failed to fetch GitHub Action runs.',
    };
  }
}

/**
 * Trigger GitHub Actions workflow dispatch
 */
export async function triggerWorkflowDispatch(
  settings: GitHubRepoSettings,
  variant: 'release' | 'debug' = 'release',
  workflowFile: string = 'build-android-apk.yml'
): Promise<{ success: boolean; message: string }> {
  const { owner, repo, branch, token } = settings;
  if (!token || !token.trim()) {
    return {
      success: false,
      message: 'GitHub Personal Access Token is required to trigger a workflow.',
    };
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: branch || 'main',
          inputs: {
            build_variant: variant,
            clean_old_cache: 'true',
          },
        }),
      }
    );

    if (res.status === 204) {
      return {
        success: true,
        message: 'Build triggered successfully on GitHub Actions! Compiling APK now.',
      };
    } else {
      const errText = await res.text();
      return {
        success: false,
        message: `GitHub returned (${res.status}): ${errText}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to trigger workflow dispatch.',
    };
  }
}

/**
 * Replace source code in GitHub:
 * Deletes old conflicting files and commits the new clean Android project files
 */
export async function pushAndReplaceSourceToGitHub(
  settings: GitHubRepoSettings,
  newFiles: AndroidProjectFile[],
  commitMessage: string = '🚀 [Auto-Replace] Deploy new Android source & clean old code'
): Promise<{ success: boolean; message: string; commitSha?: string }> {
  const { owner, repo, branch, token } = settings;
  if (!token || !token.trim()) {
    return {
      success: false,
      message: 'GitHub Personal Access Token is required to push source code directly.',
    };
  }

  const headers = {
    Authorization: `Bearer ${token.trim()}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    // 1. Get branch commit SHA
    const branchRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      { headers }
    );
    if (!branchRes.ok) {
      const err = await branchRes.text();
      throw new Error(`Failed to get branch ref: ${err}`);
    }
    const branchData = await branchRes.json();
    const latestCommitSha = branchData.object.sha;

    // 2. Get latest commit details to get base tree
    const commitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
      { headers }
    );
    if (!commitRes.ok) {
      const err = await commitRes.text();
      throw new Error(`Failed to get latest commit: ${err}`);
    }
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // 3. Create tree items for each new clean file
    // Filter out any conflicting .kts if groovy exists
    const hasGroovy = newFiles.some((f) => f.path === 'build.gradle');
    const sanitizedFiles = newFiles.filter((f) => {
      if (hasGroovy && (f.path.endsWith('.kts') || f.name.endsWith('.kts'))) {
        return false;
      }
      return true;
    });

    const treeItems = sanitizedFiles.map((file) => ({
      path: file.path,
      mode: file.name === 'gradlew' ? '100755' : '100644',
      type: 'blob',
      content: file.content,
    }));

    // Explicitly delete conflicting .kts if present
    treeItems.push({
      path: 'build.gradle.kts',
      mode: '100644',
      type: 'blob',
      content: null as any,
    });
    treeItems.push({
      path: 'settings.gradle.kts',
      mode: '100644',
      type: 'blob',
      content: null as any,
    });
    treeItems.push({
      path: 'app/build.gradle.kts',
      mode: '100644',
      type: 'blob',
      content: null as any,
    });

    // 4. Create new tree
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems.filter((item) => item.content !== null),
        }),
      }
    );

    if (!treeRes.ok) {
      const err = await treeRes.text();
      throw new Error(`Failed to create git tree: ${err}`);
    }
    const newTreeData = await treeRes.json();

    // 5. Create new commit
    const newCommitRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: commitMessage,
          tree: newTreeData.sha,
          parents: [latestCommitSha],
        }),
      }
    );

    if (!newCommitRes.ok) {
      const err = await newCommitRes.text();
      throw new Error(`Failed to create commit: ${err}`);
    }
    const newCommitData = await newCommitRes.json();

    // 6. Update branch ref
    const updateRefRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: newCommitData.sha,
          force: true,
        }),
      }
    );

    if (!updateRefRes.ok) {
      const err = await updateRefRes.text();
      throw new Error(`Failed to update branch ref: ${err}`);
    }

    return {
      success: true,
      message: 'New Android source deployed and old conflicting files cleared! APK build will start now.',
      commitSha: newCommitData.sha,
    };
  } catch (err: any) {
    console.error('Source replace error:', err);
    return {
      success: false,
      message: err.message || 'Failed to replace source code on GitHub.',
    };
  }
}
