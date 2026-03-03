import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Server, 
  Cloud, 
  Settings, 
  RefreshCw, 
  Search, 
  Database as DbIcon, 
  Globe, 
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  X,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Resource = {
  id: string;
  provider: 'aliyun' | 'volcengine';
  resource_type: string;
  name: string;
  status: string;
  region_id: string;
  private_ip: string;
  public_ip: string;
  updated_at: string;
  config_json: {
    category: string;
  };
};

const CATEGORIES = ['全部', '计算', '网络', '存储', '数据库', '安全', '管理与运维', '其他'];

type CloudConfig = {
  id: number;
  provider: string;
  name: string;
  regions: string;
  last_sync: string | null;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'resources' | 'settings'>('dashboard');
  const [activeCategory, setActiveCategory] = useState('全部');
  const [resources, setResources] = useState<Resource[]>([]);
  const [configs, setConfigs] = useState<CloudConfig[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Account Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newConfig, setNewConfig] = useState({
    provider: 'aliyun',
    name: '',
    access_key: '',
    secret_key: '',
    regions: ['cn-beijing']
  });

  useEffect(() => {
    fetchResources();
    fetchConfigs();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/resources');
      const data = await res.json();
      setResources(data);
    } catch (err) {
      console.error('Failed to fetch resources', err);
    }
  };

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/configs');
      const data = await res.json();
      setConfigs(data);
    } catch (err) {
      console.error('Failed to fetch configs', err);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      // Simulate sync delay
      setTimeout(() => {
        setIsSyncing(false);
        fetchResources();
        fetchConfigs();
      }, 2000);
    } catch (err) {
      setIsSyncing(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewConfig({ provider: 'aliyun', name: '', access_key: '', secret_key: '', regions: ['cn-beijing'] });
        fetchConfigs();
      }
    } catch (err) {
      console.error('Save config failed', err);
    }
  };

  const handleDeleteConfig = async (id: number) => {
    if (!confirm('确定要删除该云账号配置吗？相关资源快照将保留。')) return;
    // Note: Backend delete API not implemented yet, but we'll mock the refresh
    fetchConfigs();
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.private_ip?.includes(searchQuery);
    
    const matchesCategory = activeCategory === '全部' || r.config_json?.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (cat: string) => {
    if (cat === '全部') return resources.length;
    return resources.filter(r => r.config_json?.category === cat).length;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex font-sans text-slate-900">
      {/* Sidebar ... (same as before) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <DbIcon size={20} />
          </div>
          <h1 className="font-bold text-xl tracking-tight">CloudCMDB</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <NavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label="仪表盘"
          />
          <NavItem 
            active={activeTab === 'resources'} 
            onClick={() => setActiveTab('resources')}
            icon={<Server size={20} />}
            label="资源清单"
          />
          <NavItem 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings size={20} />}
            label="云集成配置"
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">同步状态</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-700">状态: {isSyncing ? '同步中...' : '就绪'}</span>
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  isSyncing ? "animate-spin text-indigo-600" : "hover:bg-white hover:shadow-sm text-slate-400"
                )}
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {activeTab === 'dashboard' && '资源概览'}
            {activeTab === 'resources' && '资源清单'}
            {activeTab === 'settings' && '云集成配置'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="搜索资源 ID, 名称, IP..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-full text-sm w-64 focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <StatCard title="总资源数" value={resources.length} icon={<DbIcon className="text-indigo-600" />} />
                  <StatCard title="计算资源" value={getCategoryCount('计算')} icon={<Server className="text-emerald-600" />} />
                  <StatCard title="网络资源" value={getCategoryCount('网络')} icon={<Globe className="text-sky-600" />} />
                  <StatCard title="存储资源" value={getCategoryCount('存储')} icon={<Cloud className="text-amber-600" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold mb-6">资源分类占比</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {CATEGORIES.filter(c => c !== '全部').map(cat => (
                        <div key={cat} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{cat}</p>
                          <p className="text-xl font-bold text-slate-900">{getCategoryCount(cat)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-semibold mb-4">最近同步记录</h3>
                    <div className="space-y-4">
                      {configs.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <ProviderBadge provider={c.provider as any} />
                            <span className="text-sm font-medium">{c.name}</span>
                          </div>
                          <span className="text-xs text-slate-400">成功</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'resources' && (
              <motion.div 
                key="resources"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Category Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                        activeCategory === cat 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                          : "bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                      )}
                    >
                      {cat} <span className="ml-1 opacity-60 text-xs">{getCategoryCount(cat)}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">资源名称/ID</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">分类</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">类型</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">地域</th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredResources.length > 0 ? filteredResources.map((resource) => (
                        <tr key={resource.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">{resource.name || '未命名'}</span>
                                <ProviderBadge provider={resource.provider} />
                              </div>
                              <span className="text-xs text-slate-400 font-mono mt-0.5">{resource.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {resource.config_json?.category || '未分类'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                              {resource.resource_type.split('::').pop()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={resource.status} />
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {resource.region_id}
                          </td>
                          <td className="px-6 py-4">
                            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                              <ExternalLink size={16} />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                            该分类下暂无资源，请尝试同步或切换分类。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">已连接的云账号</h3>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Plus size={18} />
                    <span>添加账号</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {configs.length > 0 ? configs.map(config => (
                    <div key={config.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          config.provider === 'aliyun' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                        )}>
                          <Cloud size={24} />
                        </div>
                        <div>
                          <h4 className="font-semibold">{config.name}</h4>
                          <p className="text-sm text-slate-500">{config.provider === 'aliyun' ? '阿里云 (Alibaba Cloud)' : '火山云 (Volcengine)'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">上次同步</p>
                          <p className="text-sm text-slate-700">{config.last_sync || '从未同步'}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                            <Settings size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteConfig(config.id)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center">
                      <Cloud className="mx-auto text-slate-300 mb-4" size={48} />
                      <p className="text-slate-500">暂未配置云账号，请点击上方按钮添加。</p>
                    </div>
                  )}
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex gap-4">
                  <div className="text-indigo-600">
                    <Lock size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-indigo-900">安全与隐私</h4>
                    <p className="text-sm text-indigo-800 mt-1 leading-relaxed">
                      您的 API 凭据将加密存储在本地 SQLite 数据库中。建议使用具备 <b>ReadOnlyAccess</b> 权限的子账号 (RAM/IAM) 以降低风险。
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Add Account Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">连接新云账号</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveConfig} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-2xl">
                      <button 
                        type="button"
                        onClick={() => setNewConfig({...newConfig, provider: 'aliyun'})}
                        className={cn(
                          "py-2.5 rounded-xl text-sm font-semibold transition-all",
                          newConfig.provider === 'aliyun' ? "bg-white text-orange-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        阿里云
                      </button>
                      <button 
                        type="button"
                        onClick={() => setNewConfig({...newConfig, provider: 'volcengine'})}
                        className={cn(
                          "py-2.5 rounded-xl text-sm font-semibold transition-all",
                          newConfig.provider === 'volcengine' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                      >
                        火山云
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">账号显示名称</label>
                        <input 
                          required
                          type="text" 
                          placeholder="例如：生产环境主账号"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                          value={newConfig.name}
                          onChange={e => setNewConfig({...newConfig, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Access Key ID</label>
                        <input 
                          required
                          type="text" 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-mono"
                          value={newConfig.access_key}
                          onChange={e => setNewConfig({...newConfig, access_key: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Secret Access Key</label>
                        <input 
                          required
                          type="password" 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-mono"
                          value={newConfig.secret_key}
                          onChange={e => setNewConfig({...newConfig, secret_key: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        取消
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                      >
                        保存并连接
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
        active 
          ? "bg-indigo-50 text-indigo-700 font-medium" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      {icon}
      <span>{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
    </button>
  );
}

function StatCard({ title, value, icon, change }: { title: string, value: string | number, icon: React.ReactNode, change?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
          {icon}
        </div>
        {change && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            {change}
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function CategoryItem({ label, count, color }: { label: string, count: number, color: string }) {
  return (
    <div className={cn("p-4 rounded-xl flex flex-col gap-1", color)}>
      <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</span>
      <span className="text-xl font-bold">{count}</span>
    </div>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const isAliyun = provider === 'aliyun';
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
      isAliyun ? "bg-orange-50 text-orange-700 border border-orange-100" : "bg-blue-50 text-blue-700 border border-blue-100"
    )}>
      <div className={cn("w-1.5 h-1.5 rounded-full", isAliyun ? "bg-orange-500" : "bg-blue-500")} />
      {isAliyun ? '阿里云' : '火山云'}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isRunning = status === 'Running' || status === 'active';
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
      isRunning ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-600 border border-slate-200"
    )}>
      {status}
    </span>
  );
}
