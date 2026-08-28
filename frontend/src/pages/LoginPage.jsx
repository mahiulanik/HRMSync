import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getApiError } from "../utils/apiError.js";
import { ArrowLeft, Eye, EyeOff, Mail, KeyRound, Lock, RotateCcw } from 'lucide-react';

export default function LoginPage({ role }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [timer, setTimer] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (forgotStep === 2) {
      setTimer(300);
      setCanResend(false);
      otpRefs.current = otpRefs.current.slice(0, 6);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [forgotStep]);

  useEffect(() => {
    if (forgotStep === 2 && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [forgotStep, timer === 300]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = pasted.split('').concat(Array(6 - pasted.length).fill(''));
      setOtp(newOtp);
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleResendOTP = async () => {
    setForgotError('');
    setForgotMsg('');
    setForgotLoading(true);
    try {
      await api.post('/forgot-password', { email: forgotEmail });
      setForgotMsg('OTP resent to your email');
      setTimer(300);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
    setForgotError(
        getApiError(err, "Failed to resend OTP")
    );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, role);
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/employee/dashboard');
    } catch (err) {
    setError(
        getApiError(err, "Login failed")
    );
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');
    setForgotLoading(true);
    try {
      await api.post('/forgot-password', { email: forgotEmail });
      setForgotMsg('OTP sent to your email');
      setForgotStep(2);
    } catch (err) {
    setForgotError(
        getApiError(err, "Failed to send OTP")
    );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) {
      setForgotError('Please enter all 6 digits');
      return;
    }
    setForgotError('');
    setForgotMsg('');
    setForgotLoading(true);
    try {
      await api.post('/verify-reset-otp', { email: forgotEmail, otp: otpStr });
      setForgotMsg('OTP verified successfully');
      setForgotStep(3);
    } catch (err) {
    setForgotError(
        getApiError(err, "Invalid OTP")
    );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMsg('');
    setForgotLoading(true);
    try {
      await api.post('/reset-password', { email: forgotEmail, otp: otp.join(''), newPassword });
      setForgotMsg('Password reset successfully! You can now login.');
      setTimeout(() => {
        setForgotMode(false);
        setForgotStep(1);
        setForgotEmail('');
        setOtp(['', '', '', '', '', '']);
        setNewPassword('');
        setForgotMsg('');
        setPassword('');
      }, 2000);
    } catch (err) {
    setForgotError(
        getApiError(err, "Failed to reset password")
    );
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgot = () => {
    setForgotMode(false);
    setForgotStep(1);
    setForgotError('');
    setForgotMsg('');
    setForgotEmail('');
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
  };

  const isAdmin = role === 'admin';

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <div className="w-full lg:w-1/2 bg-sidebar flex flex-col justify-center px-8 sm:px-16 py-12 lg:py-0">
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
          HRMSync
        </h1>
        <p className="text-gray-400 text-base leading-relaxed max-w-md">
          Streamline your workforce operations, track attendance, manage payroll, and empower your team securely.
        </p>
      </div>
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center px-8 sm:px-16 py-12 lg:py-0">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 text-sm">
          <ArrowLeft size={16} />
          Back to portals
        </button>

        {!forgotMode ? (
          <>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">{isAdmin ? 'Admin Portal' : 'Employee Portal'}</h2>
            <p className="text-text-secondary mb-8">{isAdmin ? 'Sign in to manage the organization' : 'Sign in to access your account'}</p>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary pr-12"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <button
              onClick={() => { setForgotMode(true); setForgotError(''); setForgotMsg(''); }}
              className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
            >
              <KeyRound size={15} />
              Forgot password?
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">
              {forgotStep === 1 && 'Reset Password'}
              {forgotStep === 2 && 'Verify OTP'}
              {forgotStep === 3 && 'New Password'}
            </h2>
            <p className="text-text-secondary mb-8">
              {forgotStep === 1 && 'Enter your email to receive a reset OTP'}
              {forgotStep === 2 && 'Enter the 6-digit code sent to your email'}
              {forgotStep === 3 && 'Create a new password for your account'}
            </p>

            {forgotError && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{forgotError}</div>}
            {forgotMsg && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{forgotMsg}</div>}

            {forgotStep === 1 && (
              <form onSubmit={handleSendOTP}>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOTP}>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3 text-center">One-Time Password</label>
                  <div className="flex justify-center gap-2 sm:gap-3 mb-4">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => otpRefs.current[i] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-bold border border-border rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    ))}
                  </div>

                  <div className="text-center mb-4">
                    {timer > 0 ? (
                      <p className="text-sm text-text-secondary">
                        Code expires in <span className="font-semibold text-primary">{formatTime(timer)}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-red-500 font-medium">Code expired</p>
                    )}
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={!canResend || forgotLoading}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <RotateCcw size={14} className={forgotLoading ? 'animate-spin' : ''} />
                      Resend OTP
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading || otp.join('').length !== 6}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword}>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      minLength={8}
                      className="w-full pl-10 pr-12 py-3 border border-border rounded-lg focus:outline-none focus:border-primary"
                      required
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                >
                  {forgotLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            <button onClick={resetForgot} className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
              <ArrowLeft size={15} />
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
