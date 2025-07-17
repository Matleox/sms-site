import React, { useState, useEffect, useRef } from 'react';
import { Send, History, Settings, MessageSquare, Phone, CheckCircle, AlertCircle, Clock, Shield, LogOut, Zap, Target, BarChart3, Activity, Moon, Sun, Trash2, ChevronLeft, ChevronRight, X, Users, UserPlus, Calendar, Key, Eye, EyeOff, Smartphone, QrCode } from 'lucide-react';

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

interface User {
  id: string;
  key: string;
  tag: string;
  expiryDate: string;
  createdAt: string;
  isActive: boolean;
  remainingDays: number;
  userType: 'normal' | 'premium' | 'admin';
  dailyLimit: number;
  dailyUsed: number;
}

interface UserLog {
  id: string;
  userKey: string;
  action: 'login' | 'logout';
  ipAddress: string;
  timestamp: string;
}

interface LoginData {
  isLoggedIn: boolean;
  isAdmin: boolean;
  token?: string;
  dailyLimit: number;
  dailyUsed: number;
  userType: 'normal' | 'premium' | 'admin';
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function App() {
  const [activeTab, setActiveTab] = useState('login');
  const [smsHistory, setSmsHistory] = useState<SMSData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [backendUrl, setBackendUrl] = useState('https://sms-api-qb7q.onrender.com');
  const [apiUrl, setApiUrl] = useState('');
  const [loginData, setLoginData] = useState<LoginData>({ 
    isLoggedIn: false, 
    isAdmin: false, 
    dailyLimit: 500,
    dailyUsed: 0,
    userType: 'normal'
  });
  const [key, setKey] = useState('');
  const [phone, setPhone] = useState('');
  const [count, setCount] = useState(0);
  const [mode, setMode] = useState<'normal' | 'turbo'>('turbo');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [newUserKey, setNewUserKey] = useState('');
  const [newUserTag, setNewUserTag] = useState('');
  const [newUserDays, setNewUserDays] = useState(30);
  const [newUserType, setNewUserType] = useState<'normal' | 'premium'>('normal');
  const [historyTab, setHistoryTab] = useState<'sms' | 'user'>('sms');
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [currentUserLogPage, setCurrentUserLogPage] = useState(1);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(300);
  
  // 2FA States
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [showTwoFASetup, setShowTwoFASetup] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(false);
  const [tempToken, setTempToken] = useState('');
  
  const logsPerPage = 10;
  const usersPerPage = 10;
  const userLogsPerPage = 10;
  const logoutTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);

  const email = 'mehmetyilmaz24121@gmail.com';

  // Otomatik logout fonksiyonları
  const resetLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    setShowLogoutWarning(false);
    setLogoutCountdown(300);

    if (loginData.isLoggedIn) {
      warningTimerRef.current = window.setTimeout(() => {
        setShowLogoutWarning(true);
        countdownTimerRef.current = window.setInterval(() => {
          setLogoutCountdown(prev => {
            if (prev <= 1) {
              handleLogout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 25 * 60 * 1000);

      logoutTimerRef.current = window.setTimeout(() => {
        handleLogout();
      }, 30 * 60 * 1000);
    }
  };

  const handleUserActivity = () => {
    if (loginData.isLoggedIn) {
      resetLogoutTimer();
    }
  };

  const fetchUsers = async () => {
    if (!loginData.isAdmin || !loginData.token) return;
    
    try {
      const res = await fetch(`${backendUrl}/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`,
        },
      });
      
      if (!res.ok) {
        console.error('Kullanıcılar çekilemedi:', res.status);
        return;
      }
      
      const data = await res.json();
      const formattedUsers: User[] = data.map((user: any) => {
        const isAdmin = user.is_admin || user.isAdmin || false;
        const userType = isAdmin ? 'admin' : (user.user_type || user.userType || 'normal');
        
        return {
          id: user.id || user.key,
          key: user.key,
          tag: user.user_id || user.tag || user.key,
          expiryDate: user.expiry_date || user.expiryDate,
          createdAt: user.created_at || user.createdAt,
          isActive: user.is_active !== false,
          remainingDays: calculateRemainingDays(user.expiry_date || user.expiryDate),
          userType: userType,
          dailyLimit: isAdmin ? 0 : (user.daily_limit || user.dailyLimit || 500),
          dailyUsed: isAdmin ? 0 : (user.daily_used || user.dailyUsed || 0),
        };
      });
      
      setUsers(formattedUsers);
    } catch (err) {
      console.error('Kullanıcılar çekilirken hata:', err);
    }
  };

  const calculateRemainingDays = (expiryDate: string): number => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  useEffect(() => {
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
      const updatedLogin = {
        ...login,
        userType: login.userType || (login.isAdmin ? 'admin' : 'normal'),
        dailyLimit: login.dailyLimit || (login.isAdmin ? 0 : 500),
        dailyUsed: login.dailyUsed || 0
      };
      setLoginData(updatedLogin);
      if (login.isLoggedIn) {
        setActiveTab('send');
        if (login.isAdmin) {
          fetchUsers();
        }
      }
    }
  }, []);

  useEffect(() => {
    if (loginData.isLoggedIn && loginData.isAdmin) {
      fetch(`${backendUrl}/admin/2fa-status`, {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setTwoFAEnabled(data.enabled);
        }
      })
      .catch(err => console.error('2FA status error:', err));
    }
  }, [loginData.isLoggedIn, loginData.isAdmin, loginData.token, backendUrl]);

  useEffect(() => {
    if (loginData.isLoggedIn) {
      resetLogoutTimer();

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity, true);
      });

      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity, true);
        });
        
        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }
        if (warningTimerRef.current) {
          clearTimeout(warningTimerRef.current);
        }
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
      };
    }
  }, [loginData.isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('smsHistory', JSON.stringify(smsHistory));
    localStorage.setItem('loginData', JSON.stringify(loginData));
  }, [smsHistory, loginData]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const updateUserDays = () => {
      setUsers(prevUsers => 
        prevUsers.map(user => {
          const remainingDays = calculateRemainingDays(user.expiryDate);
          return {
            ...user,
            remainingDays,
            isActive: remainingDays > 0
          };
        })
      );
    };

    updateUserDays();
    const interval = setInterval(updateUserDays, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'users' && loginData.isAdmin && loginData.token) {
      fetchUsers();
    }
  }, [activeTab, loginData.isAdmin, loginData.token]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    const newToast: Toast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
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

  const clearUserLogs = () => {
    if (window.confirm('Tüm kullanıcı loglarını silmek istediğinizden emin misiniz?')) {
      setUserLogs([]);
      setCurrentUserLogPage(1);
      showToast('Kullanıcı logları temizlendi', 'success');
    }
  };

  const addUser = async () => {
    if (!newUserKey.trim()) {
      showToast('Lütfen kullanıcı key\'i girin!', 'error');
      return;
    }

    if (users.some(user => user.key === newUserKey.trim())) {
      showToast('Bu key zaten mevcut!', 'error');
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/admin/add-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`,
        },
        body: JSON.stringify({
          key: newUserKey.trim(),
          user_id: newUserTag.trim() || newUserKey.trim(),
          expiry_days: newUserDays,
          is_admin: false,
          user_type: newUserType,
        }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const data = await res.json();
      
      if (data.new_token) {
        setLoginData(prev => ({
          ...prev,
          token: data.new_token
        }));
        localStorage.setItem('loginData', JSON.stringify({
          ...loginData,
          token: data.new_token
        }));
      }
      
      await fetchUsers();
      
      setNewUserKey('');
      setNewUserTag('');
      setNewUserDays(30);
      showToast('Kullanıcı başarıyla eklendi!', 'success');
    } catch (err: any) {
      showToast(`Hata: ${err.message}`, 'error');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`,
        },
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const data = await res.json();
      
      if (data.new_token) {
        setLoginData(prev => ({
          ...prev,
          token: data.new_token
        }));
        localStorage.setItem('loginData', JSON.stringify({
          ...loginData,
          token: data.new_token
        }));
      }
      
      await fetchUsers();
      showToast('Kullanıcı silindi', 'success');
    } catch (err: any) {
      showToast(`Hata: ${err.message}`, 'error');
    }
  };

  const handleLogin = async () => {
    if (!key.trim()) {
      showToast('Lütfen key girin!', 'error');
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await fetch(`${backendUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: key.trim()
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorText = data.detail || 'Giriş başarısız!';
        showToast(errorText, 'error');
        return;
      }

      if (data.new_token) {
        setLoginData(prev => ({
          ...prev,
          token: data.new_token
        }));
        localStorage.setItem('loginData', JSON.stringify({
          ...loginData,
          token: data.new_token
        }));
      }

      if (data.requires_2fa) {
        setTempToken(data.temp_token);
        setPendingLogin(true);
      } else if (data.access_token) {
        const loginInfo = {
          isLoggedIn: true,
          isAdmin: data.is_admin,
          token: data.access_token,
          userType: data.user_type,
          dailyLimit: data.daily_limit,
          dailyUsed: data.daily_used
        };

        setLoginData(loginInfo);
        localStorage.setItem('loginData', JSON.stringify(loginInfo));
        setActiveTab('send');
        showToast('Giriş başarılı!', 'success');

        if (data.is_admin) {
          fetchUsers();
        }

        resetLogoutTimer();
      }

    } catch (err) {
      console.error('Login hatası:', err);
      showToast('Bağlantı hatası!', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleTwoFALogin = async () => {
    if (!twoFACode.trim()) {
      showToast('Lütfen 2FA kodunu girin', 'error');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp_token: tempToken,
          code: twoFACode
        })
      });

      const data = await response.json();
      
      if (data.access_token) {
        const loginInfo = {
          isLoggedIn: true,
          isAdmin: data.is_admin,
          token: data.access_token,
          userType: data.user_type || 'normal',
          dailyLimit: data.daily_limit || 0,
          dailyUsed: data.daily_used || 0
        };

        setLoginData(loginInfo);
        localStorage.setItem('loginData', JSON.stringify(loginInfo));
        setPendingLogin(false);
        setTempToken('');
        setTwoFACode('');
        setKey('');
        setActiveTab('send');
        showToast('Giriş başarılı!', 'success');

        if (data.is_admin) {
          fetchUsers();
        }

        resetLogoutTimer();
      } else {
        showToast(data.detail || '2FA kodu geçersiz', 'error');
      }
    } catch (err) {
      showToast('2FA doğrulama hatası', 'error');
    }
  };

  const handleToggle2FA = async () => {
    try {
      if (!twoFAEnabled) {
        const response = await fetch(`${backendUrl}/admin/enable-2fa`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        
        const data = await response.json();
        if (data.status === 'success') {
          setQrCodeUrl(data.qr_code);
          setShowTwoFASetup(true);
        }
      } else {
        const response = await fetch(`${backendUrl}/admin/disable-2fa`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        
        const data = await response.json();
        if (data.status === 'success') {
          setTwoFAEnabled(false);
          setQrCodeUrl('');
          setShowTwoFASetup(false);
          if (data.new_token) {
            setLoginData(prev => ({
              ...prev,
              token: data.new_token
            }));
            localStorage.setItem('loginData', JSON.stringify({
              ...loginData,
              token: data.new_token
            }));
          }
        }
      }
    } catch (err) {
      console.error('2FA toggle error:', err);
    }
  };

  const handleConfirm2FA = async () => {
    if (!twoFACode.trim()) {
      showToast('Lütfen 2FA kodunu girin', 'error');
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/admin/confirm-2fa`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: twoFACode })
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setTwoFAEnabled(true);
        setShowTwoFASetup(false);
        setTwoFACode('');
        setQrCodeUrl('');
        showToast('2FA başarıyla aktif edildi!', 'success');
        if (data.new_token) {
          setLoginData(prev => ({
            ...prev,
            token: data.new_token
          }));
          localStorage.setItem('loginData', JSON.stringify({
            ...loginData,
            token: data.new_token
          }));
        }
      } else {
        showToast(data.detail || '2FA kodu geçersiz', 'error');
      }
    } catch (err) {
      showToast('2FA onaylama hatası', 'error');
    }
  };

  const handleLogout = () => {
    setLoginData({ 
      isLoggedIn: false, 
      isAdmin: false, 
      dailyLimit: 500,
      dailyUsed: 0,
      userType: 'normal'
    });
    setActiveTab('login');
    setKey('');
    setPhone('');
    setCount(0);
    setMode('turbo');
    setUsers([]);
    setUserLogs([]);
    setCurrentPage(1);
    setCurrentUserPage(1);
    setCurrentUserLogPage(1);
    setNewUserKey('');
    setNewUserTag('');
    setNewUserDays(30);
    setNewUserType('normal');
    setHistoryTab('sms');
    setShowLogoutWarning(false);
    setLogoutCountdown(300);
    
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    
    localStorage.removeItem('loginData');
    showToast('Çıkış yapıldı!', 'info');
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

      if (result.new_token) {
        setLoginData(prev => ({
          ...prev,
          token: result.new_token
        }));
        localStorage.setItem('loginData', JSON.stringify({
          ...loginData,
          token: result.new_token
        }));
      }

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

  const totalPages = Math.ceil(smsHistory.length / logsPerPage);
  const startIndex = (currentPage - 1) * logsPerPage;
  const endIndex = startIndex + logsPerPage;
  const currentLogs = smsHistory.slice(startIndex, endIndex);

  const totalUserPages = Math.ceil(users.length / usersPerPage);
  const userStartIndex = (currentUserPage - 1) * usersPerPage;
  const userEndIndex = userStartIndex + usersPerPage;
  const currentUsers = users.slice(userStartIndex, userEndIndex);

  const totalUserLogPages = Math.ceil(userLogs.length / userLogsPerPage);
  const userLogStartIndex = (currentUserLogPage - 1) * userLogsPerPage;
  const userLogEndIndex = userLogStartIndex + userLogsPerPage;
  const currentUserLogs = userLogs.slice(userLogStartIndex, userLogEndIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToUserPage = (page: number) => {
    setCurrentUserPage(page);
  };

  const goToUserLogPage = (page: number) => {
    setCurrentUserLogPage(page);
  };

  const userTabs = [{ id: 'send', label: 'SMS Gönder', icon: Send }];
  const adminTabs = [
    { id: 'send', label: 'SMS Gönder', icon: Send },
    { id: 'history', label: 'Geçmiş', icon: History },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
    { id: 'users', label: 'Kullanıcılar', icon: Users },
  ];
  const availableTabs = loginData.isAdmin ? adminTabs : userTabs;

  const themeClasses = isDarkMode 
    ? 'min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white'
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

  // 2FA Doğrulama Ekranı
  if (pendingLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-gray-800 text-white">
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

        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Shield className="w-12 h-12 mr-3 text-blue-400" />
                <h1 className="text-3xl font-bold text-white">2FA Doğrulama</h1>
              </div>
              <p className="text-gray-300">6 haneli doğrulama kodunu girin</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-center text-gray-300">
                  Doğrulama Kodu
                </label>
                <input
                  type="text"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyPress={(e) => e.key === 'Enter' && handleTwoFALogin()}
                  placeholder="000000"
                  className="w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleTwoFALogin}
                className="w-full font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Doğrula
              </button>

              <button
                onClick={() => {
                  setPendingLogin(false);
                  setTempToken('');
                  setTwoFACode('');
                  setKey('');
                }}
                className="w-full font-medium py-2 px-4 rounded-lg transition-all duration-200 text-gray-400 hover:text-white"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login Ekranı
  if (!loginData.isLoggedIn) {
    return (
      <div className={themeClasses}>
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Key girin"
                    className={`w-full px-4 py-3 pr-12 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className={`w-full font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center ${
                  isLoggingIn 
                    ? 'bg-blue-500 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Giriş Yapılıyor...
                  </>
                ) : (
                  'Giriş Yap'
                )}
              </button>

              <div className={`text-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <p>Güvenli giriş için key'inizi girin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ana Panel
  return (
    <div className={themeClasses}>
      {/* Toast Notifications */}
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

      {/* Logout Warning Modal */}
      {showLogoutWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className={`${cardClasses} rounded-2xl p-6 max-w-md w-full mx-4`}>
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Oturum Sona Eriyor
              </h3>
              <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {Math.floor(logoutCountdown / 60)}:{(logoutCountdown % 60).toString().padStart(2, '0')} sonra otomatik çıkış yapılacak
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowLogoutWarning(false);
                    resetLogoutTimer();
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${buttonClasses} text-white`}
                >
                  Devam Et
                </button>
                <button
                  onClick={handleLogout}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                      : 'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}
                >
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {showTwoFASetup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className={`${cardClasses} rounded-2xl p-6 max-w-md w-full mx-4`}>
            <div className="text-center">
              <QrCode className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                2FA Kurulumu
              </h3>
              
              {qrCodeUrl && (
                <div className="mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-2 rounded-lg" />
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    QR kodu Google Authenticator ile tarayın
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <input
                  type="text"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 haneli kod"
                  className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses} text-center text-xl tracking-widest`}
                  maxLength={6}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleConfirm2FA}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${buttonClasses} text-white`}
                >
                  Onayla
                </button>
                <button
                  onClick={() => {
                    setShowTwoFASetup(false);
                    setTwoFACode('');
                    setQrCodeUrl('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                      : 'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`${cardClasses} rounded-b-2xl shadow-xl`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className={`w-8 h-8 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SMS Panel</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
              
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {loginData.isAdmin ? 'Admin' : `${loginData.userType} Kullanıcı`}
              </div>
              
              <button
                onClick={handleLogout}
                className={`flex items-center px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className={`${cardClasses} rounded-xl p-1`}>
          <nav className="flex space-x-1">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? `${buttonClasses} text-white shadow-lg`
                      : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-8">
        {/* SMS Gönder Tab */}
        {activeTab === 'send' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`${cardClasses} rounded-xl p-6`}>
                <div className="flex items-center">
                  <Target className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Toplam Gönderim</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {getTotalStats().total}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`${cardClasses} rounded-xl p-6`}>
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Başarılı</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {getTotalStats().sent}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`${cardClasses} rounded-xl p-6`}>
                <div className="flex items-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Başarısız</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {getTotalStats().failed}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`${cardClasses} rounded-xl p-6`}>
                <div className="flex items-center">
                  <BarChart3 className="w-8 h-8 text-purple-500 mr-3" />
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Başarı Oranı</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {getTotalStats().total > 0 
                        ? `${Math.round((getTotalStats().sent / getTotalStats().total) * 100)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SMS Form */}
            <div className={`${cardClasses} rounded-xl p-8`}>
              <div className="flex items-center mb-6">
                <Send className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SMS Gönder</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefon Numarası
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="5xxxxxxxxx"
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                    maxLength={10}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <MessageSquare className="w-4 h-4 inline mr-2" />
                    SMS Sayısı
                  </label>
                  <input
                    type="number"
                    value={count || ''}
                    onChange={(e) => setCount(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="100"
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Gönderim Modu
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setMode('normal')}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      mode === 'normal'
                        ? `${buttonClasses} text-white`
                        : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                    }`}
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    Normal
                  </button>
                  <button
                    onClick={() => setMode('turbo')}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      mode === 'turbo'
                        ? `${buttonClasses} text-white`
                        : `${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                    }`}
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Turbo
                  </button>
                </div>
              </div>
              
              <button
                onClick={sendSMS}
                disabled={isLoading || !phone || count === 0}
                className={`w-full mt-6 py-4 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
                  isLoading || !phone || count === 0
                    ? `${isDarkMode ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500'} cursor-not-allowed`
                    : `${buttonClasses} text-white hover:shadow-lg transform hover:-translate-y-0.5`
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Gönderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    SMS Gönder
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Geçmiş Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className={`${cardClasses} rounded-xl p-8`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <History className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>SMS Geçmişi</h2>
                </div>
                
                <button
                  onClick={clearHistory}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Temizle
                </button>
              </div>
              
              {smsHistory.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Henüz SMS gönderilmemiş
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Alıcı
                          </th>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Sayı
                          </th>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Mod
                          </th>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Durum
                          </th>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Sonuç
                          </th>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Tarih
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentLogs.map((sms) => (
                          <tr key={sms.id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <td className={`py-3 px-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {sms.recipient}
                            </td>
                            <td className={`py-3 px-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {sms.count}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                sms.mode === 'turbo'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {sms.mode === 'turbo' ? (
                                  <>
                                    <Zap className="w-3 h-3 mr-1" />
                                    Turbo
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 mr-1" />
                                    Normal
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center">
                                {getStatusIcon(sms.status)}
                                <span className={`ml-2 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {getStatusText(sms.status)}
                                </span>
                              </div>
                            </td>
                            <td className={`py-3 px-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {sms.status === 'completed' && (
                                <span className="text-sm">
                                  ✅ {sms.successCount} / ❌ {sms.failedCount}
                                </span>
                              )}
                            </td>
                            <td className={`py-3 px-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {sms.timestamp}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {startIndex + 1}-{Math.min(endIndex, smsHistory.length)} / {smsHistory.length} kayıt
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`p-2 rounded-lg transition-colors ${
                            currentPage === 1
                              ? `${isDarkMode ? 'text-gray-600' : 'text-gray-400'} cursor-not-allowed`
                              : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                          }`}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? `${buttonClasses} text-white`
                                : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`p-2 rounded-lg transition-colors ${
                            currentPage === totalPages
                              ? `${isDarkMode ? 'text-gray-600' : 'text-gray-400'} cursor-not-allowed`
                              : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                          }`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Ayarlar Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className={`${cardClasses} rounded-xl p-8`}>
              <div className="flex items-center mb-6">
                <Settings className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Sistem Ayarları</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    SMS API URL
                  </label>
                  <input
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="API URL'sini girin"
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Backend URL
                  </label>
                  <input
                    type="text"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="Backend URL'sini girin"
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                  />
                </div>

                {/* 2FA Ayarları */}
                <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    İki Faktörlü Doğrulama (2FA)
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        2FA Durumu
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {twoFAEnabled ? 'İki faktörlü doğrulama aktif' : 'İki faktörlü doğrulama pasif'}
                      </p>
                    </div>
                    
                    <button
                      onClick={handleToggle2FA}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        twoFAEnabled 
                          ? 'bg-blue-600' 
                          : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          twoFAEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  
                  {twoFAEnabled && (
                    <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-green-500 mr-2" />
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>
                          2FA aktif - Hesabınız güvende!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${backendUrl}/admin/set-api-url`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${loginData.token}`,
                        },
                        body: JSON.stringify({ api_url: apiUrl }),
                      });
                      
                      if (res.ok) {
                        showToast('Ayarlar kaydedildi!', 'success');
                      } else {
                        throw new Error('Kaydetme hatası');
                      }
                    } catch (err) {
                      showToast('Ayarlar kaydedilemedi!', 'error');
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${buttonClasses} text-white`}
                >
                  Ayarları Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kullanıcılar Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Kullanıcı Ekleme Formu */}
            <div className={`${cardClasses} rounded-xl p-8`}>
              <div className="flex items-center mb-6">
                <UserPlus className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Yeni Kullanıcı Ekle</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Key
                  </label>
                  <input
                    type="text"
                    value={newUserKey}
                    onChange={(e) => setNewUserKey(e.target.value)}
                    placeholder="Kullanıcı key'i"
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tag
                  </label>
                  <input
                    type="text"
                    value={newUserTag}
                    onChange={(e) => setNewUserTag(e.target.value)}
                    placeholder="Kullanıcı tag'i"
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Süre (Gün)
                  </label>
                  <input
                    type="number"
                    value={newUserDays}
                    onChange={(e) => setNewUserDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                    min="1"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tip
                  </label>
                  <select
                    value={newUserType}
                    onChange={(e) => setNewUserType(e.target.value as 'normal' | 'premium')}
                    className={`w-full px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${inputClasses}`}
                  >
                    <option value="normal">Normal</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={addUser}
                className={`mt-4 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${buttonClasses} text-white`}
              >
                <UserPlus className="w-5 h-5 mr-2 inline" />
                Kullanıcı Ekle
              </button>
            </div>

            {/* Kullanıcı Listesi */}
            <div className={`${cardClasses} rounded-xl p-8`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Users className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Kullanıcılar</h2>
                </div>
              </div>
              
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Henüz kullanıcı eklenmemiş
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Key
                          </th>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Tag
                          </th>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Tip
                          </th>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Durum
                          </th>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Kalan Gün
                          </th>
                          <th className={`text-left py-3 px-4 font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentUsers.map((user) => (
                          <tr key={user.id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <td className={`py-3 px-4 font-mono text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {user.key}
                            </td>
                            <td className={`py-3 px-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {user.tag}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.userType === 'admin'
                                  ? 'bg-red-100 text-red-800'
                                  : user.userType === 'premium'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.userType === 'admin' ? 'Admin' : user.userType === 'premium' ? 'Premium' : 'Normal'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {user.isActive ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td className={`py-3 px-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {user.remainingDays} gün
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => deleteUser(user.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDarkMode 
                                    ? 'text-red-400 hover:bg-red-900/20' 
                                    : 'text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* User Pagination */}
                  {totalUserPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {userStartIndex + 1}-{Math.min(userEndIndex, users.length)} / {users.length} kullanıcı
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => goToUserPage(currentUserPage - 1)}
                          disabled={currentUserPage === 1}
                          className={`p-2 rounded-lg transition-colors ${
                            currentUserPage === 1
                              ? `${isDarkMode ? 'text-gray-600' : 'text-gray-400'} cursor-not-allowed`
                              : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                          }`}
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        
                        {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => goToUserPage(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentUserPage === page
                                ? `${buttonClasses} text-white`
                                : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={() => goToUserPage(currentUserPage + 1)}
                          disabled={currentUserPage === totalUserPages}
                          className={`p-2 rounded-lg transition-colors ${
                            currentUserPage === totalUserPages
                              ? `${isDarkMode ? 'text-gray-600' : 'text-gray-400'} cursor-not-allowed`
                              : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`
                          }`}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;