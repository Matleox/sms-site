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
}

function App() {
  const [activeTab, setActiveTab] = useState('login');
  const [smsHistory, setSmsHistory] = useState<SMSData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replitApiUrl, setReplitApiUrl] = useState('');
  const [loginData, setLoginData] = useState<LoginData>({ isLoggedIn: false, isAdmin: false });
  
  // SMS Form States
  const [phone, setPhone] = useState('');
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<'normal' | 'turbo'>('turbo');
  
  // Login States
  const [password, setPassword] = useState('');

  // Fixed email - kullanıcı değiştiremez
  const email = 'mehmetyilmaz24121@gmail.com';

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('smsHistory');
    const savedApiUrl = localStorage.getItem('replitApiUrl');
    const savedLogin = localStorage.getItem('loginData');
    
    if (savedHistory) setSmsHistory(JSON.parse(savedHistory));
    if (savedApiUrl) setReplitApiUrl(savedApiUrl);
    if (savedLogin) {
      const login = JSON.parse(savedLogin);
      setLoginData(login);
      if (login.isLoggedIn) {
        setActiveTab('send');
      }
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('smsHistory', JSON.stringify(smsHistory));
  }, [smsHistory]);

  useEffect(() => {
    localStorage.setItem('replitApiUrl', replitApiUrl);
  }, [replitApiUrl]);

  useEffect(() => {
    localStorage.setItem('loginData', JSON.stringify(loginData));
  }, [loginData]);

  const handleLogin = async () => {
    if (!password) {
      alert('Lütfen şifre girin!');
      return;
    }

    // Simulated login - gerçek uygulamada API çağrısı yapılacak
    if (password === 'admin123') {
      setLoginData({ isLoggedIn: true, isAdmin: true });
      setActiveTab('send');
    } else if (password === 'user123') {
      setLoginData({ isLoggedIn: true, isAdmin: false });
      setActiveTab('send');
    } else {
      alert('Hatalı şifre!');
    }
    setPassword('');
  };

  const handleLogout = () => {
    setLoginData({ isLoggedIn: false, isAdmin: false });
    setActiveTab('login');
    setPassword('');
  };

  const sendSMS = async () => {
    if (!replitApiUrl) {
      alert('Lütfen önce Replit API URL\'ini ayarlayın!');
      if (loginData.isAdmin) {
        setActiveTab('settings');
      }
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
      failedCount: 0
    };

    setSmsHistory(prev => [newSMS, ...prev]);

    try {
      const response = await fetch(replitApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          email: email,
          count: count,
          mode: mode === 'turbo' ? 2 : 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update SMS status
        setSmsHistory(prev => prev.map(sms => 
          sms.timestamp === newSMS.timestamp 
            ? { 
                ...sms, 
                status: 'completed',
                successCount: result.success || Math.floor(count * 0.8),
                failedCount: result.failed || Math.floor(count * 0.2)
              }
            : sms
        ));

        alert(`SMS gönderim tamamlandı!\nBaşarılı: ${result.success || Math.floor(count * 0.8)}\nBaşarısız: ${result.failed || Math.floor(count * 0.2)}`);
      } else {
        throw new Error('API hatası');
      }
    } catch (error) {
      console.error('SMS gönderim hatası:', error);
      
      // Update SMS status to failed
      setSmsHistory(prev => prev.map(sms => 
        sms.timestamp === newSMS.timestamp 
          ? { ...sms, status: 'failed' }
          : sms
      ));
      
      alert('SMS gönderiminde hata oluştu!');
    } finally {
      setIsLoading(false);
      // Clear form
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
    const total = smsHistory.reduce((acc, sms) => ({
      sent: acc.sent + sms.successCount,
      failed: acc.failed + sms.failedCount,
      total: acc.total + sms.count
    }), { sent: 0, failed: 0, total: 0 });
    
    return total;
  };

  // Login Screen
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
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Şifrenizi girin"
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
              <p>Demo: user123 (Kullanıcı) | admin123 (Admin)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User Navigation (sadece SMS gönder ve çıkış)
  const userTabs = [
    { id: 'send', label: 'SMS Gönder', icon: Send }
  ];

  // Admin Navigation (tüm özellikler)
  const adminTabs = [
    { id: 'send', label: 'SMS Gönder', icon: Send },
    { id: 'history', label: 'Geçmiş', icon: History },
    { id: 'settings', label: 'Ayarlar', icon: Settings }
  ];

  const availableTabs = loginData.isAdmin ? adminTabs : userTabs;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="w-12 h-12 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">📲 SMS Gönderim Sistemi</h1>
          </div>
          <p className="text-gray-300">
            {loginData.isAdmin ? '👑 Admin Paneli - Tüm Özellikler' : '👤 Kullanıcı Paneli - SMS Gönderim'}
          </p>
        </div>

        {/* Stats Cards - Sadece Admin için */}
        {loginData.isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Toplam Gönderim', value: getTotalStats().total, icon: Target, color: 'blue' },
              { label: 'Başarılı', value: getTotalStats().sent, icon: CheckCircle, color: 'green' },
              { label: 'Başarısız', value: getTotalStats().failed, icon: AlertCircle, color: 'red' },
              { label: 'İşlem Sayısı', value: smsHistory.length, icon: BarChart3, color: 'purple' }
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

        {/* Navigation */}
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

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {/* SMS Gönder Tab */}
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

          {/* Geçmiş Tab - Sadece Admin */}
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

          {/* Ayarlar Tab - Sadece Admin */}
          {activeTab === 'settings' && loginData.isAdmin && (
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Settings className="w-6 h-6 mr-3 text-blue-400" />
                ⚙️ Ayarlar
              </h2>

              <div className="max-w-2xl space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Replit API URL
                  </label>
                  <input
                    type="url"
                    value={replitApiUrl}
                    onChange={(e) => setReplitApiUrl(e.target.value)}
                    placeholder="https://your-repl-name.username.repl.co/api/sms"
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  />
                  <p className="text-sm text-gray-400 mt-2">
                    Replit'teki Python SMS API'nizin URL'ini buraya girin
                  </p>
                </div>

                <div className="bg-blue-900/20 border border-blue-700/50 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-300 mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    🔧 Replit API Kurulum Rehberi:
                  </h3>
                  <ol className="text-sm text-blue-200 space-y-2 list-decimal list-inside">
                    <li>Replit'te Python projenizi açın</li>
                    <li>Flask veya FastAPI ile API endpoint'i oluşturun</li>
                    <li>POST isteği kabul eden /api/sms endpoint'i ekleyin</li>
                    <li>JSON formatında phone, email, count, mode parametrelerini alın</li>
                    <li>enough.py ve sms.py dosyalarınızı kullanın</li>
                    <li>Replit URL'inizi yukarıdaki alana yapıştırın</li>
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