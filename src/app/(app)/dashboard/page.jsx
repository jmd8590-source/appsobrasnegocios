'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Camera, PenSquare, TrendingUp, Package, Layers, Weight, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DEMO_SCRAPS,
  DEMO_STATS,
  DEMO_CHART_DATA,
} from '@/lib/demo/data';
import { getScraps } from '@/lib/scraps/service';
import {
  formatCurrency,
  formatWeight,
  formatRelativeTime,
  getStatusLabel,
} from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const stats = DEMO_STATS;
const chartData = DEMO_CHART_DATA;

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-xs text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-amber-400">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const [scraps, setScraps] = useState(DEMO_SCRAPS);

  useEffect(() => {
    async function loadData() {
      const data = await getScraps();
      setScraps(data);
    }
    loadData();
  }, []);

  const totalValue = scraps.reduce((acc, s) => acc + s.total_value, 0);
  const totalWeight = scraps.reduce((acc, s) => acc + s.weight_kg, 0);
  const totalCount = scraps.length;
  const recentScraps = scraps.slice(0, 5);

  const dynamicKpiCards = [
    {
      label: 'Valor recuperado',
      value: formatCurrency(totalValue),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      subtitle: `${scraps.filter((s) => s.status === 'available').length} disponibles`,
    },
    {
      label: 'Sobrantes',
      value: totalCount.toString(),
      icon: Package,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      subtitle: 'En tu almacén',
    },
    {
      label: 'Peso total',
      value: formatWeight(totalWeight),
      icon: Weight,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      subtitle: 'Suma de todo el inventario',
    },
    {
      label: 'Lotes activos',
      value: stats.total_lots.toString(),
      icon: Layers,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      subtitle: 'Listos para compartir',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Resumen de tu actividad de recuperación</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/manual-entry">
            <Button variant="outline" size="sm" className="gap-2 border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/50">
              <PenSquare className="w-4 h-4 text-amber-400" />
              Entrar a mano
            </Button>
          </Link>
          <Link href="/scanner">
            <Button variant="amber" size="sm" className="gap-2">
              <Camera className="w-4 h-4" />
              Escanear
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {dynamicKpiCards.map((kpi) => (
          <Card key={kpi.label} className={`border ${kpi.bgColor} card-hover`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl border ${kpi.bgColor} flex items-center justify-center`}>
                  <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-100 mb-0.5">{kpi.value}</p>
              <p className="text-xs text-slate-400">{kpi.label}</p>
              <p className="text-xs text-slate-500 mt-1">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Valor recuperado — últimos 7 días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={2} fill="url(#valueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Scraps */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                Últimos escaneos
              </CardTitle>
              <Link href="/inventory">
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">
                  Ver todos <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentScraps.map((scrap) => (
              <div key={scrap.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{scrap.material_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{formatWeight(scrap.weight_kg)}</span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-emerald-400 font-medium">{formatCurrency(scrap.total_value)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={scrap.status} className="text-[10px]">
                    {getStatusLabel(scrap.status)}
                  </Badge>
                  <span className="text-[10px] text-slate-600">{formatRelativeTime(scrap.created_at)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Mobile FAB */}
      <Link
        href="/scanner"
        className="lg:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/40 transition-all duration-200 active:scale-95"
        aria-label="Escanear material"
      >
        <Camera className="w-6 h-6" />
      </Link>
    </div>
  );
}
