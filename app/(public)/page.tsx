'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Car,
  Users,
  TrendingUp,
  Calendar,
  FileText,
  BarChart3,
  Shield,
  Zap,
  Globe,
  CheckCircle,
  ArrowRight,
  Menu,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      icon: Car,
      title: 'Gestión de Inventario',
      description: 'Controlá todos tus vehículos con especificaciones, fotos, documentos y precios en un solo lugar.',
    },
    {
      icon: Users,
      title: 'CRM de Clientes',
      description: 'Gestioná leads, registrá interacciones y nunca pierdas una oportunidad de seguimiento.',
    },
    {
      icon: TrendingUp,
      title: 'Pipeline de Ventas',
      description: 'Visualizá tus ventas desde el interés inicial hasta el cierre exitoso.',
    },
    {
      icon: Calendar,
      title: 'Agenda de Test Drives',
      description: 'Sistema de reservas para pruebas de manejo con recordatorios automáticos.',
    },
    {
      icon: FileText,
      title: 'Gestión de Documentos',
      description: 'Almacená y organizá todos los documentos de vehículos y ventas de forma segura.',
    },
    {
      icon: BarChart3,
      title: 'Panel de Analíticas',
      description: 'Métricas en tiempo real sobre ventas, inventario y rendimiento del equipo.',
    },
  ];

  const benefits = [
    'Mejor seguimiento de leads y clientes potenciales',
    'Ahorrá tiempo en tareas administrativas',
    'Toda tu información en un solo lugar',
    'Accedé desde cualquier dispositivo',
    'Tu marca y colores personalizados',
    'Generación de documentos de venta',
  ];

  const plans = [
    {
      name: 'Inicial',
      price: 29,
      currency: 'USD',
      description: 'Perfecto para empezar',
      features: [
        'Hasta 3 usuarios',
        'Hasta 50 vehículos',
      ],
      cta: 'Comenzar Gratis',
      popular: false,
    },
    {
      name: 'Profesional',
      price: 79,
      currency: 'USD',
      description: 'Para automotoras en crecimiento',
      features: [
        'Hasta 10 usuarios',
        'Hasta 200 vehículos',
      ],
      cta: 'Comenzar Gratis',
      popular: true,
    },
    {
      name: 'Empresarial',
      price: 199,
      currency: 'USD',
      description: 'Para grandes operaciones',
      features: [
        'Usuarios ilimitados',
        'Vehículos ilimitados',
      ],
      cta: 'Contactanos',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <svg width="80" height="40" viewBox="0 0 160 120" className="h-10 w-auto">
                <text
                  x="80" y="52"
                  fontFamily="Arial Black, Helvetica Neue, sans-serif"
                  fontSize="54"
                  fontWeight="900"
                  className="fill-gray-900 dark:fill-white"
                  textAnchor="middle"
                  letterSpacing="-1"
                >CARS</text>
                <rect x="20" y="64" width="120" height="4" fill="#75AADB" rx="2"/>
                <text
                  x="80" y="102"
                  fontFamily="Helvetica Neue, sans-serif"
                  fontSize="28"
                  fontWeight="200"
                  letterSpacing="22"
                  fill="#75AADB"
                  textAnchor="middle"
                >UY</text>
              </svg>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#caracteristicas" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Características
              </a>
              <a href="#precios" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Precios
              </a>
              <a href="#contacto" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Contacto
              </a>
              <Link
                href="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register-company"
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all"
              >
                Comenzar
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800">
            <div className="px-4 py-4 space-y-4">
              <a href="#caracteristicas" className="block text-gray-600 dark:text-gray-300">Características</a>
              <a href="#precios" className="block text-gray-600 dark:text-gray-300">Precios</a>
              <a href="#contacto" className="block text-gray-600 dark:text-gray-300">Contacto</a>
              <Link href="/login" className="block text-gray-600 dark:text-gray-300">Iniciar Sesión</Link>
              <Link
                href="/register-company"
                className="block w-full text-center px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-medium rounded-lg"
              >
                Comenzar
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Software de gestión para automotoras
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Tu automotora,
              <span className="text-[#75AADB]"> organizada</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              CarsUY es la plataforma todo-en-uno para gestionar tu automotora.
              Inventario, clientes, ventas y documentos en un solo lugar.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register-company"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all text-lg shadow-lg shadow-sky-500/25"
              >
                Probalo Gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#caracteristicas"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-colors text-lg"
              >
                Ver Características
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Sin tarjeta de crédito requerida
            </p>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-2 shadow-2xl shadow-sky-500/20">
              <div className="bg-slate-900 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-sm text-slate-400">Panel de CarsUY</span>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Mock dashboard stats */}
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Total Vehículos</p>
                    <p className="text-2xl font-bold text-white">48</p>
                    <p className="text-sky-400 text-sm">En stock</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Clientes</p>
                    <p className="text-2xl font-bold text-white">156</p>
                    <p className="text-sky-400 text-sm">Registrados</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Ventas del Mes</p>
                    <p className="text-2xl font-bold text-white">7</p>
                    <p className="text-sky-400 text-sm">Completadas</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Test Drives</p>
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-sky-400 text-sm">Esta semana</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple value prop */}
      <section className="py-12 border-y border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Configuración Rápida</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Empezá a usar en minutos</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Datos Seguros</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Tu información protegida</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-sky-600 dark:text-sky-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Acceso Total</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Desde cualquier dispositivo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="caracteristicas" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Todo lo que Necesitás
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Herramientas diseñadas para el día a día de tu automotora
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:shadow-sky-500/5 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-sky-500 to-blue-600">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Simplificá la Gestión de tu Automotora
              </h2>
              <p className="text-xl text-sky-100 mb-8">
                Dejá de perder tiempo con planillas de Excel y papeles.
                Toda tu información organizada y accesible cuando la necesites.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-sky-200 flex-shrink-0 mt-0.5" />
                    <span className="text-white text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                Lo que incluye CarsUY
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                  <Car className="h-8 w-8 text-sky-600 dark:text-sky-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-300">Gestión de Inventario</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                  <Users className="h-8 w-8 text-sky-600 dark:text-sky-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-300">CRM de Clientes</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                  <TrendingUp className="h-8 w-8 text-sky-600 dark:text-sky-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-300">Pipeline de Ventas</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                  <FileText className="h-8 w-8 text-sky-600 dark:text-sky-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-300">Documentación</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                  <Calendar className="h-8 w-8 text-sky-600 dark:text-sky-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-300">Test Drives</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-sky-600 dark:text-sky-400 mx-auto mb-2" />
                  <div className="text-sm text-gray-600 dark:text-gray-300">Analíticas</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Planes Simples y Transparentes
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Elegí el plan que mejor se adapte a tu automotora. Probá gratis antes de decidir.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 ${
                  plan.popular
                    ? 'border-sky-500 shadow-xl shadow-sky-500/10 md:scale-105'
                    : 'border-gray-200 dark:border-slate-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-medium rounded-full">
                    Más Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                    <span className="text-gray-500 dark:text-gray-400"> {plan.currency}/mes</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-sky-500 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register-company"
                  className={`block w-full text-center py-3 rounded-xl font-medium transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shadow-lg shadow-sky-500/25'
                      : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            ¿Listo para Organizar tu Automotora?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Empezá hoy mismo. Sin compromiso, sin tarjeta de crédito.
          </p>
          <Link
            href="/register-company"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all text-lg shadow-lg shadow-sky-500/25"
          >
            Crear Cuenta Gratis
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
              <svg width="120" height="50" viewBox="0 0 120 50">
  <text x="60" y="26" 
    font-family="Arial Black, sans-serif" 
    font-size="30" font-weight="900" 
    fill="#0a0a0a" text-anchor="middle">CARS</text>
  <rect x="12" y="32" width="96" height="3" 
    fill="#75AADB" rx="1"/>
  <text x="60" y="46" 
    font-family="Helvetica Neue, sans-serif" 
    font-size="11" font-weight="600" 
    letter-spacing="6" fill="#75AADB" 
    text-anchor="middle">UY</text>
</svg>
              </div>
              <p className="text-gray-400">
                Software de gestión para automotoras. Hecho en Uruguay.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#caracteristicas" className="hover:text-white transition-colors">Características</a></li>
                <li><a href="#precios" className="hover:text-white transition-colors">Precios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Términos de Servicio</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidad</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  hola@rodar.uy
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +598 99 123 456
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Montevideo, Uruguay
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 Rodar. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
