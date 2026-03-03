'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useMemo } from 'react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type Dataset = {
  label: string
  data: number[]
  color: string
}

type Props = {
  labels: string[]
  datasets: Dataset[]
  height?: number
}

export default function MultiBarChart({ labels, datasets, height = 300 }: Props) {
  const chartData = useMemo(() => ({
    labels,
    datasets: datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.color,
      borderColor: ds.color,
      borderWidth: 1,
      borderRadius: 4,
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
      <Bar data={chartData} options={options} />
    </div>
  )
}
