import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export interface EfficiencyData {
  inputSize: number;
  multi: number;
  single: number;
}

interface EfficiencyGraphsProps {
  data: EfficiencyData[];
  currentRun: EfficiencyData;
}

export default function EfficiencyGraphs({ data, currentRun }: EfficiencyGraphsProps) {
  // Show the live current run on the bar graph
  const barData = [currentRun];

  // For the line chart, show history. If history is empty, show current run to avoid empty state.
  const lineData = data.length > 0 ? data : [currentRun];

  return (
    <div className="w-full space-y-8 flex flex-col items-center">
      {/* Bar Graph Card */}
      <div className="w-full bg-[#1e293b] p-6 rounded-xl shadow-lg border border-[#334155]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#e2e8f0] text-center">
            Live Step Comparison
          </h2>
          <p className="text-center text-[#94a3b8] mt-2">
            Multi-tape vs Single-tape for current execution (Input size: {currentRun.inputSize})
          </p>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 30, right: 40, left: 40, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="inputSize" 
                stroke="#e2e8f0"
                tick={{ fill: "#e2e8f0", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(val) => `Size: ${val}`}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={60}
                label={{
                  value: "Input Size",
                  position: "insideBottom",
                  offset: -20,
                  fill: "#e2e8f0"
                }}
              />
              <YAxis 
                stroke="#e2e8f0"
                tick={{ fill: "#e2e8f0", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                domain={['dataMin - 10', 'dataMax + 100']}
                label={{
                  value: "Steps",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#e2e8f0"
                }}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ 
                  backgroundColor: '#0f172a',
                  color: '#e2e8f0',
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' 
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', color: '#e2e8f0' }} 
                iconType="circle"
              />
              <Bar 
                dataKey="multi" 
                name="Multi-tape Steps" 
                fill="#60a5fa" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={80}
              />
              <Bar 
                dataKey="single" 
                name="Single-tape Steps" 
                fill="#f87171" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={80}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Graph Card */}
      <div className="w-full bg-[#1e293b] p-6 rounded-xl shadow-lg border border-[#334155]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#e2e8f0] text-center">
            Efficiency Trend Over Time
          </h2>
          <p className="text-center text-[#94a3b8] mt-2">
            Historical growth of required steps as input size increases
          </p>
        </div>
        <div className="h-80 w-full">
          {data.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-[#94a3b8]">
              Complete a simulation run to see trend data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 30, right: 40, left: 40, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="inputSize" 
                  stroke="#e2e8f0"
                  tick={{ fill: "#e2e8f0", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                  label={{
                    value: "Input Size",
                    position: "insideBottom",
                    offset: -20,
                    fill: "#e2e8f0"
                  }}
                />
                <YAxis 
                  stroke="#e2e8f0"
                  tick={{ fill: "#e2e8f0", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  domain={['dataMin - 10', 'dataMax + 100']}
                  label={{
                    value: "Steps",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#e2e8f0"
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a',
                    color: '#e2e8f0',
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' 
                  }}
                  labelFormatter={(value) => `Input Size: ${value}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px', color: '#e2e8f0' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="multi"
                  name="Multi-tape"
                  stroke="#60a5fa"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="single"
                  name="Single-tape"
                  stroke="#f87171"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
