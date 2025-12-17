import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface CategoryDistributionChartProps {
  data: {
    category: string
    value: number
    count: number
  }[]
}

export default function CategoryDistributionChart({ data }: CategoryDistributionChartProps) {
  const chartRef = useRef<ChartJS<'doughnut'>>(null)

  const COLORS = [
    'rgb(59, 130, 246)',   // blue
    'rgb(34, 197, 94)',    // green
    'rgb(251, 146, 60)',   // orange
    'rgb(168, 85, 247)',   // purple
    'rgb(236, 72, 153)',   // pink
    'rgb(250, 204, 21)',   // yellow
    'rgb(239, 68, 68)',    // red
    'rgb(20, 184, 166)',   // teal
  ]

  const chartData = {
    labels: data.map(d => d.category),
    datasets: [
      {
        data: data.map(d => d.value),
        backgroundColor: COLORS.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 15,
          generateLabels: (chart: any) => {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              const dataset = data.datasets[0]
              const total = dataset.data.reduce((a: number, b: number) => a + b, 0)
              return data.labels.map((label: string, i: number) => {
                const value = dataset.data[i]
                const percentage = ((value / total) * 100).toFixed(1)
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: dataset.backgroundColor[i],
                  hidden: false,
                  index: i
                }
              })
            }
            return []
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const label = context.label || ''
            const value = context.parsed
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            const item = data[context.dataIndex]
            return [
              `${label}: ฿${value.toLocaleString('th-TH')}`,
              `Items: ${item.count}`,
              `Percentage: ${percentage}%`
            ]
          }
        }
      }
    },
    cutout: '60%'
  }

  useEffect(() => {
    const chart = chartRef.current
    if (chart) {
      chart.update()
    }
  }, [data])

  return (
    <div className="relative h-80">
      <Doughnut ref={chartRef} data={chartData} options={options} />
    </div>
  )
}