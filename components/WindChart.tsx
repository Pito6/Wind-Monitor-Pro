
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WindChartProps {
  data: Array<{ time: string; speed: number }>;
}

const WindChart: React.FC<WindChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-64 mt-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
      <h3 className="text-slate-400 text-sm font-semibold mb-4 uppercase tracking-wider">Predpoveď rýchlosti vetra</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false}
            unit=" km/h"
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
            itemStyle={{ color: '#38bdf8' }}
          />
          <Line 
            type="monotone" 
            dataKey="speed" 
            stroke="#38bdf8" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#38bdf8', strokeWidth: 2, stroke: '#0f172a' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            name="Rýchlosť"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WindChart;
