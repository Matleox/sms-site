import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  History, 
  Settings, 
  Send, 
  Plus, 
  Trash2, 
  Moon, 
  Sun, 
  LogOut,
  Shield,
  User,
  Clock,
  Activity
} from 'lucide-react';

interface User {
  id: string;
  key: string;
  type: 'normal' | 'premium';
  createdAt: string;
  expiresAt: string;
  usageLimit: number;
}

interface SMSLog {
  id: string;
  phone: string;
  message: string;
  timestamp: string;
  status: 'success' | 'failed';
}

interface UserLog {
  id: string;
  userKey: string;
  action: 'login' | 'logout';
  ipAddress: string;
  timestamp: string;
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'admin' | 'user'>('user');
  const [activeTab, setActiveTab] = useState('sms');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [historyTab, setHistoryTab] = useState('sms');
  
  // SMS States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCount, setSmsCount] = useState(1);
  const [dailyUsageLimit] = useState(100); // Sen kod kısmında düzenleyeceksin
  
  // User Management States
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      key: 'user123',
      type: 'normal',
      createdAt: '2024-01-15',
      expiresAt: '2024-02-15',
      usageLimit: 100
    },
    {
      id: '2',
      key: 'premium456',
      type: 'premium',
      createdAt: '2024-01-10',
      expiresAt: '2024-03-10',
      usageLimit: 500
    }
  ]);
  
  const [newUserKey, setNewUserKey] = useState('');
  const [newUserType, setNewUserType] = useState<'normal' | 'premium'>('normal');
  const [newUserDuration, setNewUserDuration] = useState('');
  
  // History States
  const [smsHistory, setSmsHistory] = useState<SMSLog[]>([
    {
      id: '1',
      phone: '5551234567',
      message: 'Test mesajı',
      timestamp: '2024-01-15 14:30:25',
      status: 'success'
    },
    {
      id: '2',
      phone: '5559876543',
      message: 'Başka bir mesaj',
      timestamp: '2024-01-15 14:25:10',
      status: 'failed'
    }
  ]);
  
  const [userLogs, setUserLogs] = useState<UserLog[]>([
    {
      id: '1',
      userKey: 'user123',
      action: 'login',
      ipAddress: '192.168.1.100',
      timestamp: '2024-01-15 14:30:25'
    },
    {
      id: '2',
      userKey: 'premium456',
      action: 'logout',
      ipAddress: '192.168.1.101',
      timestamp: '2024-01-15 14:25:10'
    }
  ]);
  
  // Pagination States
  const [currentSmsPage, setCurrentSmsPage] = useState(1);
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [currentUserLogPage, setCurrentUserLogPage] = useState(1);
  const itemsPerPage = 5;
  
  // Login States
  const [loginKey, setLoginKey] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginKey === 'admin123') {
      setIsLoggedIn(true);
      setUserType('admin');
      setActiveTab('sms');
      showToastMessage('Admin olarak giriş yapıldı!', 'success');
    } else if (loginKey === 'user123') {
      setIsLoggedIn(true);
      setUserType('user');
      setActiveTab('sms');
      showToastMessage('Kullanıcı olarak giriş yapıldı!', 'success');
    } else {
      showToastMessage('Geçersiz key!', 'error');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserType('user');
    setActiveTab('sms');
    setLoginKey('');
    showToastMessage('Çıkış yapıldı!', 'info');
  };

  const handleSendSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || smsCount < 1) {
      showToastMessage('Lütfen geçerli bilgiler girin!', 'error');
      return;
    }
    
    // SMS gönderme simülasyonu
    const newLog: SMSLog = {
      id: Date.now().toString(),
      phone: phoneNumber,
      message: `${smsCount} adet SMS gönderildi`,
      timestamp: new Date().toLocaleString('tr-TR'),
      status: 'success'
    };
    
    setSmsHistory(prev => [newLog, ...prev]);
    showToastMessage(`${smsCount} adet SMS başarıyla gönderildi!`, 'success');
    setPhoneNumber('');
    setSmsCount(1);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserKey || !newUserDuration) {
      showToastMessage('Lütfen tüm alanları doldurun!', 'error');
      return;
    }

    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(newUserDuration));
    
    const newUser: User = {
      id: Date.now().toString(),
      key: newUserKey,
      type: newUserType,
      createdAt: new Date().toLocaleDateString('tr-TR'),
      expiresAt: expirationDate.toLocaleDateString('tr-TR'),
      usageLimit: newUserType === 'premium' ? 500 : 100
    };
    
    setUsers(prev => [...prev, newUser]);
    showToastMessage('Kullanıcı başarıyla eklendi!', 'success');
    setNewUserKey('');
    setNewUserDuration('');
    setNewUserType('normal');
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    showToastMessage('Kullanıcı silindi!', 'info');
  };

  const clearSmsHistory = () => {
    setSmsHistory([]);
    showToastMessage('SMS geçmişi temizlendi!', 'info');
  };

  const clearUserLogs = () => {
    setUserLogs([]);
    showToastMessage('Kullanıcı logları temizlendi!', 'info');
  };

  // Pagination logic
  const getPaginatedItems = (items: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalPages = (items: any[]) => Math.ceil(items.length / itemsPerPage);

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900'
      }`}>
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-3 rounded-full transition-all duration-300 ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                : 'bg-white hover:bg-gray-100 text-gray-600'
            } shadow-lg hover:shadow-xl`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-4 right-4 z-50 animate-fade-in">
            <div className={`px-6 py-4 rounded-lg shadow-lg backdrop-blur-lg border ${
              toastType === 'success' ? 'bg-green-500/90 border-green-400' :
              toastType === 'error' ? 'bg-red-500/90 border-red-400' :
              'bg-blue-500/90 border-blue-400'
            } text-white`}>
              <div className="flex items-center justify-between">
                <span>{toastMessage}</span>
                <button 
                  onClick={() => setShowToast(false)}
                  className="ml-4 text-white/80 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center min-h-screen p-4">
          <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl backdrop-blur-lg border ${
            isDarkMode 
              ? 'bg-gray-900/50 border-gray-700' 
              : 'bg-white/70 border-gray-200'
          }`}>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className={`p-4 rounded-full ${
                  isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                }`}>
                  <Shield size={32} className="text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">SMS Panel</h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Güvenli giriş için key'inizi girin
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Giriş Key'i
                </label>
                <input
                  type="password"
                  value={loginKey}
                  onChange={(e) => setLoginKey(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Key'inizi girin..."
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:ring-4 focus:ring-blue-500/50"
              >
                Giriş Yap
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`backdrop-blur-lg border-b sticky top-0 z-40 ${
        isDarkMode 
          ? 'bg-gray-900/50 border-gray-700' 
          : 'bg-white/70 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
              }`}>
                <MessageSquare size={24} className="text-white" />
              </div>
              <h1 className="text-xl font-bold">SMS Panel</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                userType === 'admin' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {userType === 'admin' ? 'Admin' : 'Kullanıcı'}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                    : 'bg-white hover:bg-gray-100 text-gray-600'
                } shadow-lg hover:shadow-xl`}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                <LogOut size={16} />
                <span>Çıkış</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in">
          <div className={`px-6 py-4 rounded-lg shadow-lg backdrop-blur-lg border ${
            toastType === 'success' ? 'bg-green-500/90 border-green-400' :
            toastType === 'error' ? 'bg-red-500/90 border-red-400' :
            'bg-blue-500/90 border-blue-400'
          } text-white`}>
            <div className="flex items-center justify-between">
              <span>{toastMessage}</span>
              <button 
                onClick={() => setShowToast(false)}
                className="ml-4 text-white/80 hover:text-white"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveTab('sms')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'sms'
                ? 'bg-blue-600 text-white shadow-lg'
                : isDarkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Send size={16} />
            <span>SMS Gönder</span>
          </button>

          {userType === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : isDarkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users size={16} />
              <span>Kullanıcılar</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-lg'
                : isDarkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <History size={16} />
            <span>Geçmiş</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-lg'
                : isDarkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings size={16} />
            <span>Ayarlar</span>
          </button>
        </div>

        {/* SMS Gönder Tab */}
        {activeTab === 'sms' && (
          <div className={`rounded-2xl shadow-xl backdrop-blur-lg border p-8 ${
            isDarkMode 
              ? 'bg-gray-900/50 border-gray-700' 
              : 'bg-white/70 border-gray-200'
          }`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Send className="mr-3 text-blue-500" size={28} />
              SMS Gönderimi
            </h2>

            <form onSubmit={handleSendSMS} className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Telefon Numarası
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="5xxxxxxxxx"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  SMS Adedi: {smsCount}
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={smsCount}
                  onChange={(e) => setSmsCount(parseInt(e.target.value))}
                  className="slider w-full"
                  style={{'--value': `${smsCount}%`} as React.CSSProperties}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>

              {/* Günlük Kullanım Hakkı */}
              <div className={`p-4 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-600' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Günlük Kullanım Hakkı:
                  </span>
                  <span className="text-blue-400 font-bold">
                    {dailyUsageLimit}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:ring-4 focus:ring-blue-500/50"
              >
                SMS Gönder
              </button>
            </form>
          </div>
        )}

        {/* Kullanıcılar Tab (Sadece Admin) */}
        {activeTab === 'users' && userType === 'admin' && (
          <div className={`rounded-2xl shadow-xl backdrop-blur-lg border p-8 ${
            isDarkMode 
              ? 'bg-gray-900/50 border-gray-700' 
              : 'bg-white/70 border-gray-200'
          }`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Users className="mr-3 text-blue-500" size={28} />
              Kullanıcı Yönetimi
            </h2>

            {/* Kullanıcı Ekleme Formu */}
            <form onSubmit={handleAddUser} className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  value={newUserKey}
                  onChange={(e) => setNewUserKey(e.target.value)}
                  placeholder="Key"
                  className={`px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  required
                />
                
                <select
                  value={newUserType}
                  onChange={(e) => setNewUserType(e.target.value as 'normal' | 'premium')}
                  className={`px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="normal">Normal</option>
                  <option value="premium">Premium</option>
                </select>
                
                <input
                  type="number"
                  value={newUserDuration}
                  onChange={(e) => setNewUserDuration(e.target.value)}
                  placeholder="Süre (Gün)"
                  className={`px-4 py-3 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  required
                />
                
                <button
                  type="submit"
                  className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Plus size={16} />
                  <span>Ekle</span>
                </button>
              </div>
            </form>

            {/* Kullanıcı Listesi */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <th className="text-left py-3 px-4 font-medium">Key</th>
                    <th className="text-left py-3 px-4 font-medium">Tür</th>
                    <th className="text-left py-3 px-4 font-medium">Oluşturulma</th>
                    <th className="text-left py-3 px-4 font-medium">Bitiş Tarihi</th>
                    <th className="text-left py-3 px-4 font-medium">Kullanım Hakkı</th>
                    <th className="text-left py-3 px-4 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedItems(users, currentUserPage).map((user) => (
                    <tr key={user.id} className={`border-b ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <td className="py-3 px-4">{user.key}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.type === 'premium' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.type === 'premium' ? 'Premium' : 'Normal'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{user.createdAt}</td>
                      <td className="py-3 px-4">{user.expiresAt}</td>
                      <td className="py-3 px-4">
                        <span className="text-blue-400 font-medium">
                          {user.usageLimit}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {getTotalPages(users) > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: getTotalPages(users) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentUserPage(i + 1)}
                    className={`px-3 py-1 rounded transition-all duration-300 ${
                      currentUserPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Geçmiş Tab */}
        {activeTab === 'history' && (
          <div className={`rounded-2xl shadow-xl backdrop-blur-lg border p-8 ${
            isDarkMode 
              ? 'bg-gray-900/50 border-gray-700' 
              : 'bg-white/70 border-gray-200'
          }`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <History className="mr-3 text-blue-500" size={28} />
              Geçmiş
            </h2>

            {/* History Tabs */}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setHistoryTab('sms')}
                className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                  historyTab === 'sms'
                    ? 'bg-blue-600 text-white'
                    : isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                SMS Geçmişi
              </button>
              
              {userType === 'admin' && (
                <button
                  onClick={() => setHistoryTab('users')}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    historyTab === 'users'
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Kullanıcı Logları
                </button>
              )}
            </div>

            {/* SMS History */}
            {historyTab === 'sms' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">SMS Geçmişi</h3>
                  <button
                    onClick={clearSmsHistory}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
                  >
                    <Trash2 size={16} />
                    <span>Temizle</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <th className="text-left py-3 px-4 font-medium">Telefon</th>
                        <th className="text-left py-3 px-4 font-medium">Mesaj</th>
                        <th className="text-left py-3 px-4 font-medium">Zaman</th>
                        <th className="text-left py-3 px-4 font-medium">Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedItems(smsHistory, currentSmsPage).map((log) => (
                        <tr key={log.id} className={`border-b ${
                          isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <td className="py-3 px-4">{log.phone}</td>
                          <td className="py-3 px-4">{log.message}</td>
                          <td className="py-3 px-4">{log.timestamp}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              log.status === 'success' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {log.status === 'success' ? 'Başarılı' : 'Başarısız'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* SMS Pagination */}
                {getTotalPages(smsHistory) > 1 && (
                  <div className="flex justify-center mt-6 space-x-2">
                    {Array.from({ length: getTotalPages(smsHistory) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSmsPage(i + 1)}
                        className={`px-3 py-1 rounded transition-all duration-300 ${
                          currentSmsPage === i + 1
                            ? 'bg-blue-600 text-white'
                            : isDarkMode
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* User Logs */}
            {historyTab === 'users' && userType === 'admin' && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Kullanıcı Logları</h3>
                  <button
                    onClick={clearUserLogs}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300"
                  >
                    <Trash2 size={16} />
                    <span>Temizle</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <th className="text-left py-3 px-4 font-medium">User Key</th>
                        <th className="text-left py-3 px-4 font-medium">Durum</th>
                        <th className="text-left py-3 px-4 font-medium">IP Adresi</th>
                        <th className="text-left py-3 px-4 font-medium">Zaman</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedItems(userLogs, currentUserLogPage).map((log) => (
                        <tr key={log.id} className={`border-b ${
                          isDarkMode ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <td className="py-3 px-4">{log.userKey}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                log.action === 'login' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <span>{log.action === 'login' ? 'Giriş' : 'Çıkış'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">{log.ipAddress}</td>
                          <td className="py-3 px-4">{log.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* User Logs Pagination */}
                {getTotalPages(userLogs) > 1 && (
                  <div className="flex justify-center mt-6 space-x-2">
                    {Array.from({ length: getTotalPages(userLogs) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentUserLogPage(i + 1)}
                        className={`px-3 py-1 rounded transition-all duration-300 ${
                          currentUserLogPage === i + 1
                            ? 'bg-blue-600 text-white'
                            : isDarkMode
                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Ayarlar Tab */}
        {activeTab === 'settings' && (
          <div className={`rounded-2xl shadow-xl backdrop-blur-lg border p-8 ${
            isDarkMode 
              ? 'bg-gray-900/50 border-gray-700' 
              : 'bg-white/70 border-gray-200'
          }`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Settings className="mr-3 text-blue-500" size={28} />
              Ayarlar
            </h2>

            <div className="space-y-6">
              <div className={`p-6 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="mr-2" size={20} />
                  Hesap Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Kullanıcı Türü
                    </label>
                    <p className={`text-lg font-semibold ${
                      userType === 'admin' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {userType === 'admin' ? 'Administrator' : 'Kullanıcı'}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Giriş Key'i
                    </label>
                    <p className={`text-lg font-mono ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {loginKey}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Activity className="mr-2" size={20} />
                  Sistem Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Toplam SMS
                    </label>
                    <p className="text-2xl font-bold text-blue-400">
                      {smsHistory.length}
                    </p>
                  </div>
                  {userType === 'admin' && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Toplam Kullanıcı
                      </label>
                      <p className="text-2xl font-bold text-green-400">
                        {users.length}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Tema
                    </label>
                    <p className="text-2xl font-bold text-purple-400">
                      {isDarkMode ? 'Koyu' : 'Açık'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;