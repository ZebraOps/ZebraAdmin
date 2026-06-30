import { create } from 'zustand';
import { fetchApplications, type Application } from '@/service/api/publish/applications';
import { fetchEnvironments, type Environment } from '@/service/api/publish/environment';
import { fetchK8sClusters, type K8sCluster } from '@/service/api/publish/k8s-cluster';
import { fetchLinuxMachines, type LinuxMachine } from '@/service/api/publish/linux-machine';
import { fetchLanguages, type Language } from '@/service/api/publish/language';
import { fetchBuildTemplates, type BuildTemplate } from '@/service/api/publish/build-template';
import { fetchDeployTemplates, type DeployTemplate } from '@/service/api/publish/deploy-template';
import { fetchRepos, type Repo } from '@/service/api/publish/repos';
import { fetchOrgTree, type OrgNode } from '@/service/api/rbac/org';
import { fetchJenkinsPlatforms, type JenkinsPlatform } from '@/service/api/publish/jenkins-platform';
import { fetchGitPlatforms, type GitPlatform } from '@/service/api/publish/git-repo';
import { fetchImageRegistries, type ImageRegistry } from '@/service/api/publish/image-registry';
import { fetchVendors, type Vendor } from '@/service/api/publish/vendor';

/** 通用下拉选项项 */
interface OptionItem {
  label: string;
  value: number | string;
}

interface PublishState {
  // 下拉选项缓存
  appOptions: OptionItem[];
  envOptions: OptionItem[];
  clusterOptions: OptionItem[];
  linuxMachineOptions: OptionItem[];
  languageOptions: OptionItem[];
  buildTplOptions: OptionItem[];
  deployTplOptions: OptionItem[];
  repoOptions: OptionItem[];
  orgTreeData: OrgNode[];
  jenkinsPlatformOptions: OptionItem[];
  gitPlatformOptions: OptionItem[];
  imageRegistryOptions: OptionItem[];
  vendorOptions: OptionItem[];

  // 原始数据缓存（供复杂页面使用）
  apps: Application[];
  envs: Environment[];
  clusters: K8sCluster[];
  linuxMachines: LinuxMachine[];
  languages: Language[];
  buildTemplates: BuildTemplate[];
  deployTemplates: DeployTemplate[];
  repos: Repo[];
  jenkinsPlatforms: JenkinsPlatform[];
  gitPlatforms: GitPlatform[];
  imageRegistries: ImageRegistry[];
  vendors: Vendor[];

  // 加载状态
  loading: boolean;
  loaded: boolean;

  // 操作
  loadAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** 提取下拉选项的映射函数 */
function mapAppOptions(items: Application[]): OptionItem[] {
  return items.map(a => ({ label: `${a.c_name} (${a.e_name})`, value: a.id }));
}
function mapEnvOptions(items: Environment[]): OptionItem[] {
  return items.map(e => ({ label: `${e.name} (${e.type || ''})`, value: e.id }));
}
function mapClusterOptions(items: K8sCluster[]): OptionItem[] {
  return items.map(c => ({ label: c.name, value: c.id }));
}
function mapLinuxMachineOptions(items: LinuxMachine[]): OptionItem[] {
  return items.map(s => ({ label: `${s.name} (${s.host})`, value: s.id }));
}
function mapLanguageOptions(items: Language[]): OptionItem[] {
  return items.map(l => ({ label: l.display_name || l.name, value: l.name }));
}
function mapBuildTplOptions(items: BuildTemplate[]): OptionItem[] {
  return items.map(b => ({ label: b.name, value: b.id }));
}
function mapDeployTplOptions(items: DeployTemplate[]): OptionItem[] {
  return items.map(d => ({ label: `${d.name} (${d.template_type})`, value: d.id }));
}
function mapRepoOptions(items: Repo[]): OptionItem[] {
  return items.map(r => ({ label: `${r.c_name} (${r.e_name})`, value: r.id }));
}
function mapJenkinsPlatformOptions(items: JenkinsPlatform[]): OptionItem[] {
  return items.map(j => ({ label: `${j.display_name || j.name} (${j.url})`, value: j.id }));
}
function mapGitPlatformOptions(items: GitPlatform[]): OptionItem[] {
  return items.map(g => ({ label: `${g.display_name || g.name} (${g.url})`, value: g.id }));
}
const registryTypeLabels: Record<string, string> = { v2: 'V2', harbor: 'Harbor', acr: 'ACR' };
function mapImageRegistryOptions(items: ImageRegistry[]): OptionItem[] {
  return items.map(i => ({ label: `${i.name} (${i.url}) [${registryTypeLabels[i.type] || i.type}]`, value: i.id }));
}
function mapVendorOptions(items: Vendor[]): OptionItem[] {
  return items.map(v => ({ label: v.name, value: v.provider || v.name }));
}

/** 解析分页结果，提取 records */
function extractRecords<T>(res: unknown): T[] {
  if (res && typeof res === 'object') {
    const r = res as Record<string, unknown>;
    if (Array.isArray(r.records)) return r.records as T[];
    if (Array.isArray(r.data)) return r.data as T[];
  }
  return [];
}

export const usePublishStore = create<PublishState>((set, get) => ({
  appOptions: [],
  envOptions: [],
  clusterOptions: [],
  linuxMachineOptions: [],
  languageOptions: [],
  buildTplOptions: [],
  deployTplOptions: [],
  repoOptions: [],
  orgTreeData: [],
  jenkinsPlatformOptions: [],
  gitPlatformOptions: [],
  imageRegistryOptions: [],
  vendorOptions: [],
  apps: [],
  envs: [],
  clusters: [],
  linuxMachines: [],
  languages: [],
  buildTemplates: [],
  deployTemplates: [],
  repos: [],
  jenkinsPlatforms: [],
  gitPlatforms: [],
  imageRegistries: [],
  vendors: [],
  loading: false,
  loaded: false,

  loadAll: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });

    try {
      const results = await Promise.allSettled([
        fetchApplications({ page: 1, size: 200 }),
        fetchEnvironments({ page: 1, size: 200 }),
        fetchK8sClusters({ page: 1, size: 200 }),
        fetchLinuxMachines({ page: 1, size: 200 }),
        fetchLanguages({ page: 1, size: 200 }),
        fetchBuildTemplates({ page: 1, size: 200 }),
        fetchDeployTemplates({ page: 1, size: 200 }),
        fetchRepos({ page: 1, size: 200 }),
        fetchOrgTree(),
        fetchJenkinsPlatforms({ page: 1, size: 200 }),
        fetchGitPlatforms({ page: 1, size: 200 }),
        fetchImageRegistries({ page: 1, size: 200 }),
        fetchVendors({ page: 1, size: 200 }),
      ]);

      const apps = extractRecords<Application>(results[0].status === 'fulfilled' ? results[0].value : []);
      const envs = extractRecords<Environment>(results[1].status === 'fulfilled' ? results[1].value : []);
      const clusters = extractRecords<K8sCluster>(results[2].status === 'fulfilled' ? results[2].value : []);
      const linuxMachines = extractRecords<LinuxMachine>(results[3].status === 'fulfilled' ? results[3].value : []);
      const languages = extractRecords<Language>(results[4].status === 'fulfilled' ? results[4].value : []);
      const buildTemplates = extractRecords<BuildTemplate>(results[5].status === 'fulfilled' ? results[5].value : []);
      const deployTemplates = extractRecords<DeployTemplate>(results[6].status === 'fulfilled' ? results[6].value : []);
      const repos = extractRecords<Repo>(results[7].status === 'fulfilled' ? results[7].value : []);
      const orgTreeData = results[8].status === 'fulfilled' ? (results[8].value as OrgNode[] || []) : [];
      const jenkinsPlatforms = extractRecords<JenkinsPlatform>(results[9].status === 'fulfilled' ? results[9].value : []);
      const gitPlatforms = extractRecords<GitPlatform>(results[10].status === 'fulfilled' ? results[10].value : []);
      const imageRegistries = extractRecords<ImageRegistry>(results[11].status === 'fulfilled' ? results[11].value : []);
      const vendors = extractRecords<Vendor>(results[12].status === 'fulfilled' ? results[12].value : []);

      set({
        appOptions: mapAppOptions(apps),
        envOptions: mapEnvOptions(envs),
        clusterOptions: mapClusterOptions(clusters),
        linuxMachineOptions: mapLinuxMachineOptions(linuxMachines),
        languageOptions: mapLanguageOptions(languages),
        buildTplOptions: mapBuildTplOptions(buildTemplates),
        deployTplOptions: mapDeployTplOptions(deployTemplates),
        repoOptions: mapRepoOptions(repos),
        orgTreeData,
        jenkinsPlatformOptions: mapJenkinsPlatformOptions(jenkinsPlatforms),
        gitPlatformOptions: mapGitPlatformOptions(gitPlatforms),
        imageRegistryOptions: mapImageRegistryOptions(imageRegistries),
        vendorOptions: mapVendorOptions(vendors),
        apps,
        envs,
        clusters,
        linuxMachines,
        languages,
        buildTemplates,
        deployTemplates,
        repos,
        jenkinsPlatforms,
        gitPlatforms,
        imageRegistries,
        vendors,
        loaded: true,
      });
    } catch {
      // 部分数据加载失败是可接受的，不影响使用
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    set({ loaded: false });
    await get().loadAll();
  },
}));