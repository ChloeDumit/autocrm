'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  Globe,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Car,
  Users,
  TrendingUp,
  FileText,
  Sparkles,
} from 'lucide-react';
import { RodarLogo } from '@/components/ui/rodar-logo';

export default function RegisterCompanyPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    subdomain: '',
    email: '',
    phone: '',
    userName: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [subdomainMessage, setSubdomainMessage] = useState('');

  // Debounced subdomain check
  useEffect(() => {
    const subdomain = formData.subdomain.toLowerCase();
    if (!subdomain || subdomain.length < 3) {
      setSubdomainStatus('idle');
      setSubdomainMessage('');
      return;
    }

    setSubdomainStatus('checking');

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/registration/check-subdomain/${subdomain}`
        );
        const data = await response.json();

        if (data.available) {
          setSubdomainStatus('available');
          setSubdomainMessage('Disponible');
        } else {
          setSubdomainStatus('taken');
          setSubdomainMessage(data.reason || 'No disponible');
        }
      } catch (error) {
        setSubdomainStatus('idle');
        setSubdomainMessage('');
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.subdomain]);

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, subdomain: value });
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'El nombre de la empresa es requerido';
    }

    if (!formData.subdomain || formData.subdomain.length < 3) {
      newErrors.subdomain = 'El subdominio debe tener al menos 3 caracteres';
    } else if (subdomainStatus === 'taken') {
      newErrors.subdomain = 'Este subdominio no está disponible';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresá un email válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.userName.trim()) {
      newErrors.userName = 'Tu nombre es requerido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) return;

    setIsSubmitting(true);

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          subdomain: formData.subdomain,
          email: formData.email,
          phone: formData.phone || undefined,
          userName: formData.userName,
          password: formData.password,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Error en el registro');
        }
        return res.json();
      });

      setIsSuccess(true);
    } catch (error: any) {
      setErrors({ form: error.message || 'Error en el registro. Por favor intentá de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    { icon: Car, text: 'Gestión de inventario completa' },
    { icon: Users, text: 'CRM de clientes integrado' },
    { icon: TrendingUp, text: 'Pipeline de ventas visual' },
    { icon: FileText, text: 'Documentación digital' },
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 mb-8 shadow-lg shadow-green-500/30">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ¡Solicitud Enviada!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Gracias por registrarte. Revisaremos tu solicitud y te enviaremos un email
            cuando tu cuenta esté aprobada.
          </p>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-8 border border-gray-200 dark:border-slate-700 shadow-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Tu dirección será:</p>
            <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
              {formData.subdomain}.rodar.uy
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/25"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div>
            <Link href="/">
              <RodarLogo variant="mono-white" size="lg" />
            </Link>
          </div>

          {/* Main content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Empezá gratis hoy
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Llevá tu automotora al siguiente nivel
              </h1>
              <p className="text-xl text-sky-100">
                Registrate y empezá a gestionar tu inventario, clientes y ventas de forma profesional.
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-white text-lg">{feature.text}</span>
                  </div>
                )
              })}
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-3 text-sky-100">
              <CheckCircle className="h-5 w-5" />
              <span>Sin tarjeta de crédito requerida</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-sky-200 text-sm">
            © 2026 Rodar. Software para automotoras.
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-slate-900 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-block">
              <RodarLogo variant="default" size="lg" className="text-gray-900 dark:text-white" />
            </Link>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
              step >= 1
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
            }`}>
              {step > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
            </div>
            <div className={`w-16 h-1 rounded-full transition-all ${
              step >= 2 ? 'bg-sky-500' : 'bg-gray-200 dark:bg-slate-700'
            }`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
              step >= 2
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
            }`}>
              2
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === 1 ? 'Datos de tu Empresa' : 'Creá tu Cuenta'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {step === 1
                ? 'Completá la información de tu automotora'
                : 'Configurá tus credenciales de acceso'}
            </p>
          </div>

          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
            {errors.form && (
              <div className="flex items-center gap-3 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{errors.form}</span>
              </div>
            )}

            {step === 1 ? (
              <>
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de la Empresa
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${
                        errors.companyName ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                      }`}
                      placeholder="Autos del Norte"
                    />
                  </div>
                  {errors.companyName && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.companyName}
                    </p>
                  )}
                </div>

                {/* Subdomain */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tu Dirección Web
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.subdomain}
                      onChange={handleSubdomainChange}
                      className={`w-full pl-12 pr-32 py-3.5 bg-white dark:bg-slate-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${
                        errors.subdomain ? 'border-red-500' : subdomainStatus === 'available' ? 'border-green-500' : 'border-gray-200 dark:border-slate-700'
                      }`}
                      placeholder="autosdelnorte"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                      .rodar.uy
                    </span>
                  </div>
                  <div className="mt-2 h-5">
                    {subdomainStatus === 'checking' && (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verificando...
                      </p>
                    )}
                    {subdomainStatus === 'available' && (
                      <p className="text-sm text-green-600 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {subdomainMessage}
                      </p>
                    )}
                    {subdomainStatus === 'taken' && (
                      <p className="text-sm text-red-500 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {subdomainMessage}
                      </p>
                    )}
                    {errors.subdomain && subdomainStatus !== 'taken' && (
                      <p className="text-sm text-red-500 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {errors.subdomain}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${
                        errors.email ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                      }`}
                      placeholder="tu@empresa.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Teléfono <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="+598 99 123 456"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={subdomainStatus === 'taken' || subdomainStatus === 'checking'}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
                >
                  Continuar
                  <ArrowRight className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors mb-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver
                </button>

                {/* Summary */}
                <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 border border-sky-200 dark:border-sky-800">
                  <p className="text-sm text-sky-700 dark:text-sky-300">
                    <span className="font-semibold">{formData.companyName}</span>
                    <br />
                    <span className="text-sky-600 dark:text-sky-400">{formData.subdomain}.rodar.uy</span>
                  </p>
                </div>

                {/* Your Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tu Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      className={`w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${
                        errors.userName ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                      }`}
                      placeholder="Juan Pérez"
                    />
                  </div>
                  {errors.userName && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.userName}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${
                        errors.password ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">Mínimo 8 caracteres</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`w-full pl-12 pr-12 py-3.5 bg-white dark:bg-slate-800 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all ${
                        errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      Crear Cuenta
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </>
            )}
          </form>

          <div className="mt-8 text-center">
            <span className="text-gray-500 dark:text-gray-400">
              ¿Ya tenés cuenta?{' '}
            </span>
            <Link href="/login" className="text-sky-600 hover:text-sky-700 font-semibold">
              Iniciá sesión
            </Link>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Al registrarte, aceptás nuestros{' '}
            <a href="#" className="text-sky-600 hover:underline">Términos</a>
            {' '}y{' '}
            <a href="#" className="text-sky-600 hover:underline">Política de Privacidad</a>
          </p>
        </div>
      </div>
    </div>
  );
}
