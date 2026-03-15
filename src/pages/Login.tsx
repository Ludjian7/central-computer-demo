import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { user, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated && user) {
    if (user.role === 'karyawan') {
      return <Navigate to="/pos" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      if (data.status === 'success') {
        login(data.data.token, data.data.user);
        
        // Cek kembali perannya, arahkan 'karyawan' ke kasir
        if (data.data.user.role === 'karyawan') {
          navigate('/pos', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Terjadi kesalahan saat login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f1] p-4 font-sans">
      <div className="flex flex-col md:flex-row gap-6 max-w-4xl w-full justify-center items-stretch">
        
        {/* Left Card - Login Form */}
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 w-full md:w-[380px] flex flex-col items-center justify-center min-h-[420px]">
          <div className="w-full max-w-[280px] flex flex-col items-center">
            
            {/* Header */}
            <div className="flex flex-col items-center mb-8">
              <h1 className="text-[#1a2b4c] text-[18px] font-bold tracking-widest mb-2">LOG IN</h1>
              <div className="h-[2px] w-8 bg-gradient-to-r from-[#4ade80] to-[#f97316] rounded-full"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
              
              {/* Username Input */}
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block px-4 pb-2.5 pt-4 w-full text-sm text-gray-900 bg-transparent rounded-xl border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-[#1a2b4c] peer"
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="username"
                  className="absolute text-sm text-gray-500 duration-300 transform -translate-y-4 scale-75 top-2 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-[#1a2b4c] peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-2 peer-focus:scale-75 peer-focus:-translate-y-4 left-2"
                >
                  Username *
                </label>
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block px-4 py-3 w-full text-sm text-gray-900 bg-transparent rounded-xl border border-gray-300 appearance-none focus:outline-none focus:ring-0 focus:border-[#1a2b4c]"
                  placeholder="Password *"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 mt-2 text-white font-bold text-sm rounded-xl bg-gradient-to-r from-[#52c46a] to-[#e88124] hover:opacity-90 transition-opacity shadow-[0_4px_14px_0_rgba(82,196,106,0.39)]"
              >
                LOG IN
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 text-center flex flex-col gap-2">
              <p className="text-[11px] text-gray-500">@Central_Computer</p>
              <p className="text-[11px] text-gray-500">
                Forgot password? <a href="#" className="text-[#52c46a] underline hover:text-[#3d9c4e]">Reset here</a>
              </p>
            </div>

          </div>
        </div>

        {/* Right Card - Logo */}
        <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 w-full md:w-[380px] flex items-center justify-center min-h-[420px]">
          <img 
            src="/logo.png" 
            alt="Central Computer Store Langsa" 
            className="w-full max-w-[220px] object-contain"
            onError={(e) => {
              // Fallback if logo.png is not found
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden flex-col items-center justify-center text-center">
            <div className="flex items-end justify-center mb-4">
              {/* Left side building */}
              <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 40L80 0V100H0V40Z" fill="#1b5e3a"/>
                <rect x="10" y="60" width="60" height="40" fill="#1b5e3a" stroke="white" strokeWidth="2"/>
                <rect x="15" y="65" width="50" height="15" fill="#e88124"/>
              </svg>
              {/* Right side circuit */}
              <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0L80 40V100H0V0Z" fill="none" stroke="#e88124" strokeWidth="4"/>
                <circle cx="40" cy="50" r="5" fill="#1b5e3a"/>
                <path d="M40 50H60V70" stroke="#1b5e3a" strokeWidth="3" fill="none"/>
              </svg>
            </div>
            <h2 className="text-[#1b5e3a] text-xl font-bold tracking-tight">CENTRAL COMPUTER</h2>
            <div className="flex items-center gap-2 my-1">
              <div className="h-[1px] w-8 bg-gray-300"></div>
              <p className="text-[#e88124] text-[10px] font-semibold tracking-widest">COMPUTER STORE</p>
              <div className="h-[1px] w-8 bg-gray-300"></div>
            </div>
            <h3 className="text-[#1b5e3a] text-sm font-bold tracking-widest mt-1">LANGSA</h3>
          </div>
        </div>

      </div>
    </div>
  );
}
