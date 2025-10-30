import { Construction } from 'lucide-react'
import Button from '../ui/Button'

interface ReceiveTransactionFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function ReceiveTransactionForm({ onSuccess, onCancel }: ReceiveTransactionFormProps) {
  return (
    <div className="text-center py-12">
      <Construction className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Receive Form - Coming Soon
      </h3>
      <p className="text-gray-600 mb-4">
        The receive transaction form is under development
      </p>
      <div className="space-x-3">
        <Button variant="secondary" onClick={onCancel}>
          Back
        </Button>
      </div>
    </div>
  )
}
