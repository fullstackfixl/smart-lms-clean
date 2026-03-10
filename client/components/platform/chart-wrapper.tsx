import React from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface ChartProps {
  data: any[];
  type?: 'line' | 'bar' | 'pie';
  height?: number;
  dataKey?: string;
  category?: string;
  colors?: string[];
}

export const BasicChart: React.FC<ChartProps> = ({ 
  data, 
  type = 'line', 
  height = 300,
  dataKey = 'value',
  category = 'name',
  colors = ['#3B82F6', '#F97316', '#10B981', '#64748B']
}) => {
  if (type === 'pie') {
    return (
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: 'none' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        {type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey={category} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <Tooltip 
              cursor={{ fill: '#F8FAFC' }}
              contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: 'none' }}
              animationDuration={0}
            />
            <Bar 
              dataKey={dataKey} 
              fill={colors[0]} 
              radius={[4, 4, 0, 0]} 
              isAnimationActive={false}
            />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis 
              dataKey={category} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: 'none' }}
              animationDuration={0}
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={colors[0]} 
              strokeWidth={2} 
              dot={{ r: 4, fill: colors[0], strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};
