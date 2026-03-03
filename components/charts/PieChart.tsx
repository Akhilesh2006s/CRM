'use client'

import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useMemo } from 'react'

ChartJS.register(ArcElement, Tooltip, Legend)

type PieDataItem = {
  label: string
  value: number
  color: string
}

type Props = {
  data: PieDataItem[]
  height?: number
}

export default function PieChart({ data, height = 300 }: Props) {
  const chartData = useMemo(() => ({
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((d) => d.color),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }), [data])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
      },
      tooltip: {
        intersect: false,
      },
    },
  }

  return (
    <div style={{ height: `${height}px` }}>
      <Pie data={chartData} options={options} />
    </div>
  )
}
