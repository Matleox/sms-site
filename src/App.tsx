import React, { useState, useEffect } from 'react';
import { Send, History, Settings, MessageSquare, Phone, CheckCircle, AlertCircle, Clock, Shield, LogOut, Zap, Target, BarChart3, Activity, Moon, Sun, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface SMSData {
  recipient: string;
  count: number;
  mode: 'normal' | 'turbo';
  status: 'pending' | 'sending' | 'completed' | 'failed';
  timestamp: string;
  successCount: number;
  failedCount: number;
  id: string;
}

interface LoginData {
  isLoggedIn: boolean;
  isAdmin: boolean;
  token?: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const logsPerPage = 10;

  const email = 'mehmetyilmaz24121@gmail.com';

  useEffect(() => {
    // Tema tercihini localStorage'dan al
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }

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

  useEffect(() => {
    // Tema değiştiğinde localStorage'a kaydet
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    // 4 saniye sonra toast'ı kaldır
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearHistory = () => {
    if (window.confirm('Tüm SMS geçmişini silmek istediğinizden emin misiniz?')) {
      setSmsHistory([]);
      setCurrentPage(1);
      showToast('SMS geçmişi temizlendi', 'success');
    }
  };

  const handleLogin = async () => {
    if (!key) {
      showToast('Lütfen key girin!', 'error');
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
      showToast('Başarıyla giriş yapıldı', 'success');
    } catch (err: any) {
      showToast(`Hata: ${err.message}`, 'error');
    }
  };

  const handleLogout = () => {
    setLoginData({ isLoggedIn: false, isAdmin: false });
    setActiveTab('login');
    setKey('');
    showToast('Çıkış yapıldı', 'info');
  };

  const sendSMS = async () => {
    if (!apiUrl) {
      showToast('Lütfen önce API URL\'ini ayarlayın!', 'error');
      if (loginData.isAdmin) setActiveTab('settings');
      return;
    }

    if (!phone) {
      showToast('Lütfen telefon numarası girin!', 'error');
      return;
    }

    if (phone.length !== 10) {
      showToast('Telefon numarası 10 haneli olmalıdır!', 'error');
      return;
    }

    if (count === 0) {
      showToast('Lütfen SMS sayısını belirtin!', 'error');
      return;
    }

    setIsLoading(true);

    const newSMS: SMSData = {
      id: Date.now().toString(),
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
        sms.id === newSMS.id
          ? { ...sms, status: 'completed', successCount: result.success, failedCount: result.failed }
          : sms
      ));

      showToast(`SMS gönderim tamamlandı! Başarılı: ${result.success}, Başarısız: ${result.failed}`, 'success');
    } catch (err) {
      console.error('SMS gönderim hatası:', err);
      setSmsHistory(prev => prev.map(sms =>
        sms.id === newSMS.id ? { ...sms, status: 'failed' } : sms
      ));
      showToast('SMS gönderiminde hata oluştu!', 'error');
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

  // Sayfalama için gerekli hesaplamalar
  const totalPages = Math.ceil(smsHistory.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const currentLogs = smsHistory.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const userTabs = [{ id: 'send', label: 'SMS Gönder', icon: Send }];
  const adminTabs = [
    { id: 'send', label: 'SMS Gönder', icon: Send },
    { id: 'history', label: 'Geçmiş', icon: History },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];
  const availableTabs = loginData.isAdmin ? adminTabs : userTabs;

  const themeClasses = isDarkMode 
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white'
    : 'min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900';

  const cardClasses = isDarkMode
    ? 'bg-gray-800/50 backdrop-blur-lg border border-gray-700'
    : 'bg-white/70 backdrop-blur-lg border border-gray-200 shadow-lg';

  const inputClasses = isDarkMode
    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500';

  const buttonClasses = isDarkMode
    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
    : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600';

  if (!loginData.isLoggedIn) {
    return (
      <div className={themeClasses}>
        {/* Tema Değiştirici - Sağ Üst */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full ${cardClasses} hover:scale-110 transition-all duration-200`}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
          </button>
        </div>

        <div className="flex items-center justify-center min-h-screen">
          <div className={`${cardClasses} rounded-2xl shadow-2xl p-8 w-full max-w-md`}>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Shield className={`w-12 h-12 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SMS Panel</h1>
              </div>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Güvenli giriş yapın</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Key
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Key girin"
                  className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                />
              </div>

              <button
                onClick={handleLogin}
                className={`w-full text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${buttonClasses}`}
              >
                <Shield className="w-4 h-4 mr-2" />
                Giriş Yap
              </button>

              <div className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>Demo: admin123 (Admin) | user123 (Kullanıcı)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses}>
      {/* Toast Bildirimleri */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-lg backdrop-blur-lg border transition-all duration-300 transform translate-x-0 ${
              toast.type === 'success'
                ? 'bg-green-500/90 border-green-400 text-white'
                : toast.type === 'error'
                ? 'bg-red-500/90 border-red-400 text-white'
                : 'bg-blue-500/90 border-blue-400 text-white'
            }`}
          >
            <div className="flex items-center">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
              {toast.type === 'info' && <MessageSquare className="w-5 h-5 mr-2" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Tema Değiştirici - Sağ Üst */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full ${cardClasses} hover:scale-110 transition-all duration-200`}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
        </button>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className={`w-12 h-12 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SMS Gönderim Sistemi</h1>
          </div>
          <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {loginData.isAdmin ? 'Admin Paneli - Tüm Özellikler' : 'Kullanıcı Paneli - SMS Gönderim'}
          </p>
        </div>

        {loginData.isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Toplam Gönderim', value: getTotalStats().total, icon: Target, color: isDarkMode ? 'blue-400' : 'blue-600' },
              { label: 'Başarılı', value: getTotalStats().sent, icon: CheckCircle, color: isDarkMode ? 'green-400' : 'green-600' },
              { label: 'Başarısız', value: getTotalStats().failed, icon: AlertCircle, color: isDarkMode ? 'red-400' : 'red-600' },
              { label: 'İşlem Sayısı', value: smsHistory.length, icon: BarChart3, color: isDarkMode ? 'purple-400' : 'purple-600' },
            ].map((stat, index) => (
              <div key={index} className={`${cardClasses} rounded-xl p-6`}>
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value.toLocaleString()}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 text-${stat.color}`} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center mb-8">
          <div className={`${cardClasses} rounded-xl shadow-lg p-2 flex space-x-2`}>
            {availableTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? `${buttonClasses} text-white shadow-md`
                    : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-gray-100'}`
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
            <button
              onClick={handleLogout}
              className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {activeTab === 'send' && (
            <div className={`${cardClasses} rounded-2xl shadow-2xl p-8`}>
              <h2 className={`text-2xl font-bold mb-6 flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Send className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                SMS Gönder
              </h2>

              <div className="space-y-8">
                <div className="text-center">
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Telefon (başında +90 olmadan)
                  </label>
                  <div className="relative max-w-md mx-auto">
                    <Phone className={`absolute left-3 top-3 w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="5551234567"
                      className={`w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                    />
                  </div>
                </div>

                <div className="text-center">
                  <label className={`block text-sm font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Kaç Adet SMS?
                  </label>
                  <div className="max-w-md mx-auto">
                    <input
                      type="range"
                      min="0"
                      max="500"
                      value={count}
                      onChange={(e) => setCount(parseInt(e.target.value))}
                      className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className={`text-center mt-4 p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                      <span className={`text-4xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{count}</span>
                      <span className={`ml-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>SMS</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <label className={`block text-sm font-medium mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Gönderim Türü
                  </label>
                  <div className="flex flex-col space-y-3 max-w-md mx-auto">
                    <button
                      onClick={() => setMode('normal')}
                      className={`p-4 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                        mode === 'normal'
                          ? `${buttonClasses} border-blue-500 text-white`
                          : `${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'}`
                      }`}
                    >
                      <Target className="w-5 h-5 mr-2" />
                      Normal Gönderim
                    </button>
                    <button
                      onClick={() => setMode('turbo')}
                      className={`p-4 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                        mode === 'turbo'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500 text-white'
                          : `${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50' : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'}`
                      }`}
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Turbo Gönderim
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={sendSMS}
                    disabled={isLoading}
                    className={`${buttonClasses} disabled:from-gray-600 disabled:to-gray-600 text-white px-8 py-4 rounded-lg font-medium transition-all duration-200 flex items-center text-lg mx-auto`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-3" />
                        Gönder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && loginData.isAdmin && (
            <div className={`${cardClasses} rounded-2xl shadow-2xl p-8`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <History className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  SMS Geçmişi
                </h2>
                {smsHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                      isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Temizle
                  </button>
                )}
              </div>

              {smsHistory.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Henüz SMS gönderilmemiş</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {currentLogs.map((sms, index) => (
                      <div key={sms.id} className={`rounded-xl p-6 border ${isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            {getStatusIcon(sms.status)}
                            <span className={`ml-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{sms.recipient}</span>
                            <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
                              sms.mode === 'turbo' 
                                ? 'bg-purple-900/50 text-purple-300' 
                                : 'bg-blue-900/50 text-blue-300'
                            }`}>
                              {sms.mode === 'turbo' ? 'Turbo' : 'Normal'}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{sms.timestamp}</div>
                            <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getStatusText(sms.status)}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm text-center">
                          <div>
                            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Toplam</div>
                            <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{sms.count}</div>
                          </div>
                          <div>
                            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Başarılı</div>
                            <div className="text-lg font-bold text-green-400">{sms.successCount}</div>
                          </div>
                          <div>
                            <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Başarısız</div>
                            <div className="text-lg font-bold text-red-400">{sms.failedCount}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sayfalama */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center mt-8 space-x-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          currentPage === 1
                            ? `${isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'}`
                            : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-gray-100'}`
                        }`}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                            currentPage === page
                              ? `${buttonClasses} text-white`
                              : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-gray-100'}`
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          currentPage === totalPages
                            ? `${isDarkMode ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed'}`
                            : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700/50' : 'text-gray-600 hover:bg-gray-100'}`
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <div className={`text-center mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Toplam {smsHistory.length} kayıt, Sayfa {currentPage} / {totalPages}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'settings' && loginData.isAdmin && (
            <div className={`${cardClasses} rounded-2xl shadow-2xl p-8`}>
              <h2 className={`text-2xl font-bold mb-6 flex items-center justify-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Settings className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                Ayarlar
              </h2>

              <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Backend URL
                  </label>
                  <input
                    type="url"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://sms-api-qb7q.onrender.com"
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                  />
                </div>

                <div className="text-center">
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    SMS API URL
                  </label>
                  <input
                    type="url"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="https://your-api-url.com"
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
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
                      if (res.ok) showToast('API URL kaydedildi!', 'success');
                      else showToast('Kaydetme başarısız!', 'error');
                    }}
                    className={`mt-2 px-4 py-2 rounded-lg ${buttonClasses} text-white`}
                  >
                    Kaydet
                  </button>
                </div>

                <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-blue-900/20 border border-blue-700/50' : 'bg-blue-50 border border-blue-200'}`}>
                  <h3 className={`font-semibold mb-4 flex items-center justify-center ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Backend Kurulum Rehberi:
                  </h3>
                  <ol className={`text-sm space-y-2 list-decimal list-inside text-center ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                    <li>FastAPI ile API endpoint'leri oluşturun</li>
                    <li>MySQL bağlantısı ekleyin</li>
                    <li>/login, /send-sms, /get-api-url endpoint'lerini tanımlayın</li>
                    <li>JWT ile yetkilendirme yapın</li>
                    <li>URL'yi yukarıdaki alana girin</li>
                  </ol>
                </div>

                <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-purple-900/20 border border-purple-700/50' : 'bg-purple-50 border border-purple-200'}`}>
                  <h3 className={`font-semibold mb-4 text-center ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                    Sistem Özellikleri:
                  </h3>
                  <ul className={`text-sm space-y-1 text-center ${isDarkMode ? 'text-purple-200' : 'text-purple-600'}`}>
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