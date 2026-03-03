'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useMemo } from 'react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

type Dataset = {
  label: string
  data: number[]
  borderColor?: string
  backgroundColor?: string
  fill?: boolean
}

type Props = {
  labels: string[]
  datasets: Dataset[]
  height?: number
}

export default function LineChart({ labels, datasets, height = 300 }: Props) {
  const chartData = useMemo(() => ({
    labels,
    datasets: datasets.map((ds) => ({
      ...ds,
      borderColor: ds.borderColor || '#3b82f6',
      backgroundColor: ds.backgroundColor || '#3b82f680',
      fill: ds.fill !== undefined ? ds.fill : false,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
    })),
  }), [labels, datasets])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: datasets.length > 1,
        position: 'top' as const,
      },
      tooltip: {
        intersect: false,
        mode: 'index' as const,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
        },
      },
      y: {
        grid: {
          color: '#eceff1',
        },
        ticks: {
          color: '#6b7280',
        },
      },
    },
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
