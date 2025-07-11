import React, { useState, useEffect } from 'react';
import { Send, History, Settings, MessageSquare, Phone, CheckCircle, AlertCircle, Clock, Shield, LogOut, Zap, Target, BarChart3, Activity } from 'lucide-react';

interface SMSData {
  recipient: string;
  count: number;
  mode: 'normal' | 'turbo';
  status: 'pending' | 'sending' | 'completed' | 'failed';
  timestamp: string;
  successCount: number;
  failedCount: number;
}

interface LoginData {
  isLoggedIn: boolean;
  isAdmin: boolean;
  token?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState('login');
  const [smsHistory, setSmsHistory] = useState<SMSData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState('https://sms-api-qb7q.onrender.com');
  const [apiUrl, setApiUrl] = useState('');
  const [loginData, setLoginData] = useState<LoginData>({ isLoggedIn: false, isAdmin: false });
  const [key, setKey] = useState('');
  const [phone, setPhone] = useState('');
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<'normal' | 'turbo'>('turbo');

  const email = 'mehmetyilmaz24121@gmail.com';

  useEffect(() => {
    fetch(`${backendUrl}/get-backend-url`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        const url = data.backend_url || 'https://sms-api-qb7q.onrender.com';
        setBackendUrl(url);
        return fetch(`${url}/get-api-url`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
      })
      .then(res => res.json())
      .then(data => setApiUrl(data.api_url || ''))
      .catch(err => console.error('API URL alınamadı:', err));

    const savedHistory = localStorage.getItem('smsHistory');
    const savedLogin = localStorage.getItem('loginData');
    if (savedHistory) setSmsHistory(JSON.parse(savedHistory));
    if (savedLogin) {
      const login = JSON.parse(savedLogin);
      setLoginData(login);
      if (login.isLoggedIn) setActiveTab('send');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('smsHistory', JSON.stringify(smsHistory));
    localStorage.setItem('loginData', JSON.stringify(loginData));
  }, [smsHistory, loginData]);

  const handleLogin = async () => {
    if (!key) {
      alert('Lütfen key girin!');
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error('Key bulunamadı!');
        throw new Error(await res.text());
      }
      const data = await res.json();
      setLoginData({ isLoggedIn: true, isAdmin: data.is_admin, token: data.access_token });
      setActiveTab('send');
      setKey('');
    } catch (err) {
      alert(`Hata: ${err.message}`);
    }
  };

  const handleLogout = () => {
    setLoginData({ isLoggedIn: false, isAdmin: false });
    setActiveTab('login');
    setKey('');
  };

  const sendSMS = async () => {
    if (!apiUrl) {
      alert('Lütfen önce API URL\'ini ayarlayın!');
      if (loginData.isAdmin) setActiveTab('settings');
      return;
    }

    if (!phone) {
      alert('Lütfen telefon numarası girin!');
      return;
    }

    if (phone.length !== 10) {
      alert('Telefon numarası 10 haneli olmalıdır!');
      return;
    }

    if (count === 0) {
      alert('Lütfen SMS sayısını belirtin!');
      return;
    }

    setIsLoading(true);

    const newSMS: SMSData = {
      recipient: phone,
      count: count,
      mode: mode,
      status: 'sending',
      timestamp: new Date().toLocaleString('tr-TR'),
      successCount: 0,
      failedCount: 0,
    };

    setSmsHistory(prev => [newSMS, ...prev]);

    try {
      const res = await fetch(`${backendUrl}/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({ phone, email, count, mode: mode === 'turbo' ? 2 : 1 }),
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();

      setSmsHistory(prev => prev.map(sms =>
        sms.timestamp === newSMS.timestamp
          ? { ...sms, status: 'completed', successCount: result.success, failedCount: result.failed }
          : sms
      ));

      alert(`SMS gönderim tamamlandı!\nBaşarılı: ${result.success}\nBaşarısız: ${result.failed}`);
    } catch (err) {
      console.error('SMS gönderim hatası:', err);
      setSmsHistory(prev => prev.map(sms =>
        sms.timestamp === newSMS.timestamp ? { ...sms, status: 'failed' } : sms
      ));
      alert('SMS gönderiminde hata oluştu!');
    } finally {
      setIsLoading(false);
      setPhone('');
      setCount(0);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'sending': return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'failed': return 'Başarısız';
      case 'sending': return 'Gönderiliyor';
      default: return 'Bekliyor';
    }
  };

  const getTotalStats = () => {
    return smsHistory.reduce((acc, sms) => ({
      total: acc.total + sms.count,
      sent: acc.sent + sms.successCount,
      failed: acc.failed + sms.failedCount,
    }), { total: 0, sent: 0, failed: 0 });
  };

  const userTabs = [{ id: 'send', label: 'SMS Gönder', icon: Send }];
  const adminTabs = [
    { id: 'send', label: 'SMS Gönder', icon: Send },
    { id: 'history', label: 'Geçmiş', icon: History },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];
  const availableTabs = loginData.isAdmin ? adminTabs : userTabs;

  if (!loginData.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-700">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 text-blue-400 mr-3" />
              <h1 className="text-3xl font-bold text-white">🔐 SMS Panel</h1>
            </div>
            <p className="text-gray-300">Güvenli giriş yapın</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Key
              </label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Key girin"
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
            >
              <Shield className="w-4 h-4 mr-2" />
              Giriş Yap
            </button>

            <div className="text-center text-sm text-gray-400">
              <p>Demo: admin123 (Admin) | user123 (Kullanıcı)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="w-12 h-12 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">📲 SMS Gönderim Sistemi</h1>
          </div>
          <p className="text-gray-300">
            {loginData.isAdmin ? '👑 Admin Paneli - Tüm Özellikler' : '👤 Kullanıcı Paneli - SMS Gönderim'}
          </p>
        </div>

        {loginData.isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Toplam Gönderim', value: getTotalStats().total, icon: Target, color: 'blue' },
              { label: 'Başarılı', value: getTotalStats().sent, icon: CheckCircle, color: 'green' },
              { label: 'Başarısız', value: getTotalStats().failed, icon: AlertCircle, color: 'red' },
              { label: 'İşlem Sayısı', value: smsHistory.length, icon: BarChart3, color: 'purple' },
            ].map((stat, index) => (
              <div key={index} className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 text-${stat.color}-400`} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl shadow-lg p-2 flex space-x-2 border border-gray-700">
            {availableTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 rounded-lg text-red-400 hover:bg-red-900/20 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {activeTab === 'send' && (
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Send className="w-6 h-6 mr-3 text-blue-400" />
                SMS Gönder
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6 order-2 md:order-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Telefon (başında +90 olmadan)
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="5551234567"
                        className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gönderim Türü
                    </label>
                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={() => setMode('normal')}
                        className={`p-4 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                          mode === 'normal'
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50'
                        }`}
                      >
                        <Target className="w-5 h-5 mr-2" />
                        🎯 Normal Gönderim
                      </button>
                      <button
                        onClick={() => setMode('turbo')}
                        className={`p-4 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                          mode === 'turbo'
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50'
                        }`}
                      >
                        <Zap className="w-5 h-5 mr-2" />
                        ⚡ Turbo Gönderim
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 order-1 md:order-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kaç Adet SMS?
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value))}
                      className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="text-center mt-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                      <span className="text-4xl font-bold text-blue-400">{count}</span>
                      <span className="text-gray-300 ml-2 text-lg">SMS</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={sendSMS}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 flex items-center text-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-3" />
                      🚀 Gönder
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && loginData.isAdmin && (
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <History className="w-6 h-6 mr-3 text-blue-400" />
                📋 SMS Geçmişi
              </h2>

              {smsHistory.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Henüz SMS gönderilmemiş</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {smsHistory.map((sms, index) => (
                    <div key={index} className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          {getStatusIcon(sms.status)}
                          <span className="ml-3 font-medium text-white">{sms.recipient}</span>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                            sms.mode === 'turbo' 
                              ? 'bg-purple-900/50 text-purple-300' 
                              : 'bg-blue-900/50 text-blue-300'
                          }`}>
                            {sms.mode === 'turbo' ? '⚡ Turbo' : '🎯 Normal'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">{sms.timestamp}</div>
                          <div className="text-sm font-medium text-white">{getStatusText(sms.status)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-gray-400">Toplam</div>
                          <div className="text-lg font-bold text-white">{sms.count}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">Başarılı</div>
                          <div className="text-lg font-bold text-green-400">{sms.successCount}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">Başarısız</div>
                          <div className="text-lg font-bold text-red-400">{sms.failedCount}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && loginData.isAdmin && (
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Settings className="w-6 h-6 mr-3 text-blue-400" />
                ⚙️ Ayarlar
              </h2>

              <div className="max-w-2xl space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Backend URL
                  </label>
                  <input
                    type="url"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://sms-api-qb7q.onrender.com"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    SMS API URL
                  </label>
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://your-api-url.com"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                  <button
                    onClick={async () => {
                      const res = await fetch(`${backendUrl}/admin/set-api-url`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${loginData.token}`,
                        },
                        body: JSON.stringify({ api_url: apiUrl }),
                      });
                      if (res.ok) alert('API URL kaydedildi!');
                      else alert('Kaydetme başarısız!');
                    }}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Kaydet
                  </button>
                </div>

                <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-300 mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    🔧 Backend Kurulum Rehberi:
                  </h3>
                  <ol className="text-sm text-blue-200 space-y-2 list-decimal list-inside">
                    <li>FastAPI ile API endpoint’leri oluşturun</li>
                    <li>MySQL bağlantısı ekleyin</li>
                    <li>/login, /send-sms, /get-api-url endpoint’lerini tanımlayın</li>
                    <li>JWT ile yetkilendirme yapın</li>
                    <li>URL’yi yukarıdaki alana girin</li>
                  </ol>
                </div>

                <div className="bg-purple-900/20 border border-purple-700/50 rounded-xl p-6">
                  <h3 className="font-semibold text-purple-300 mb-4">
                    📊 Sistem Özellikleri:
                  </h3>
                  <ul className="text-sm text-purple-200 space-y-1">
                    <li>• 40+ farklı SMS servisi entegrasyonu</li>
                    <li>• Normal ve Turbo gönderim modları</li>
                    <li>• Gerçek zamanlı durum takibi</li>
                    <li>• Detaylı istatistikler ve raporlama</li>
                    <li>• Güvenli login sistemi</li>
                    <li>• Sabit email: {email}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;