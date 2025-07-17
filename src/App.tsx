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
  const [logoutCountdown, setLogoutCountdown] = useState(300); // 5 dakika
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
    // Mevcut timer'ları temizle
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    // Uyarı ve countdown'ı sıfırla
    setShowLogoutWarning(false);
    setLogoutCountdown(300); // 5 dakika

    // Yeni timer'ları başlat
    if (loginData.isLoggedIn) {
      // 25 dakika sonra uyarı göster
      warningTimerRef.current = window.setTimeout(() => {
        setShowLogoutWarning(true);
        // 5 dakika countdown başlat
        countdownTimerRef.current = window.setInterval(() => {
          setLogoutCountdown(prev => {
            if (prev <= 1) {
              handleLogout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 25 * 60 * 1000); // 25 dakika

      // 30 dakika sonra logout
      logoutTimerRef.current = window.setTimeout(() => {
        handleLogout();
      }, 30 * 60 * 1000); // 30 dakika
    }
  };

  const handleUserActivity = () => {
    if (loginData.isLoggedIn) {
      resetLogoutTimer();
    }
  };

  // Kullanıcıları API'den çekme fonksiyonu
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
      // API'den gelen veriyi frontend formatına çevir
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

  // Kalan gün hesaplama fonksiyonu
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
      // Eski veri formatını yeni formata çevir
      const updatedLogin = {
        ...login,
        userType: login.userType || (login.isAdmin ? 'admin' : 'normal'),
        dailyLimit: login.dailyLimit || (login.isAdmin ? 0 : 500),
        dailyUsed: login.dailyUsed || 0
      };
      setLoginData(updatedLogin);
      if (login.isLoggedIn) {
        setActiveTab('send');
        // Admin ise kullanıcıları çek
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

  // Otomatik logout için event listener'ları
  useEffect(() => {
    if (loginData.isLoggedIn) {
      // Timer'ı başlat
      resetLogoutTimer();

      // Event listener'ları ekle
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity, true);
      });

      // Cleanup function
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity, true);
        });
        
        // Timer'ları temizle
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

  // Kullanıcılar değiştiğinde localStorage'a kaydet (sadece cache amaçlı)
  useEffect(() => {
    localStorage.setItem('smsHistory', JSON.stringify(smsHistory));
    localStorage.setItem('loginData', JSON.stringify(loginData));
    // Kullanıcıları artık localStorage'a kaydetmiyoruz, sadece API'den çekiyoruz
  }, [smsHistory, loginData]);

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Kullanıcıların kalan günlerini güncelle
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

  // Kullanıcılar sekmesine geçildiğinde kullanıcıları çek
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
      
      // Yeni token varsa güncelle
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
      
      // Kullanıcı eklendikten sonra listeyi yenile
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
      
      // Yeni token varsa güncelle
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
      
      // Kullanıcı silindikten sonra listeyi yenile
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

      // Yeni token varsa güncelle
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

      if (data.access_token) {
        // 2FA kontrolü
        if (data.requires_2fa) {
          setTempToken(data.temp_token);
          setPendingLogin(true);
        } else {
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

          // Admin ise kullanıcıları çek
          if (data.is_admin) {
            fetchUsers();
          }

          // Otomatik logout timer'ını başlat
          resetLogoutTimer();
        }
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

        // Admin ise kullanıcıları çek
        if (data.is_admin) {
          fetchUsers();
        }

        // Otomatik logout timer'ını başlat
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
        // 2FA'yı aktif et
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
        // 2FA'yı deaktif et
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
    
    // Timer'ları temizle
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

      // Yeni token varsa güncelle
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

  if (!loginData.isLoggedIn && !pendingLogin) {
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

  // 2FA doğrulama ekranı
  if (pendingLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900