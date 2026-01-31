'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface Step {
  id: string
  title: string
  description?: string
}

interface ProgressIndicatorProps {
  steps: Step[]
  currentStep: string
  completedSteps: string[]
  onStepClick?: (stepId: string) => void
}

export default function ProgressIndicator({ steps, currentStep, completedSteps, onStepClick }: ProgressIndicatorProps) {
  const getStepStatus = (stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (stepId === currentStep) return 'active'
    return 'inactive'
  }

  return (
    <div className="w-full bg-black/20 backdrop-blur-md border-b border-white/10 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id)
            const isLast = index === steps.length - 1

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => onStepClick?.(step.id)}
                  disabled={!onStepClick}
                  className={`flex flex-col items-center group outline-none ${onStepClick ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <motion.div
                    whileHover={onStepClick ? { scale: 1.1 } : {}}
                    whileTap={onStepClick ? { scale: 0.95 } : {}}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`w-12 h-12 rounded-full border-2 font-bold text-sm flex items-center justify-center transition-all duration-500 ${status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/25'
                      : status === 'active'
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                        : 'bg-black/40 border-gray-600 text-gray-400'
                      }`}
                  >
                    {status === 'completed' ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </motion.div>
                  <div className="mt-3 text-center">
                    <p className={`text-sm font-bold transition-colors ${status === 'active' ? 'text-cyan-400' :
                      status === 'completed' ? 'text-green-400' : 'text-gray-500 group-hover:text-gray-400'
                      }`}>
                      {step.title}
                    </p>
                    {step.description && (
                      <p className="text-xs text-gray-400 mt-1 max-w-24">
                        {step.description}
                      </p>
                    )}
                  </div>
                </button>

                {!isLast && (
                  <div className="flex-1 mx-6">
                    <div className={`h-1 rounded-full transition-all duration-500 ${completedSteps.includes(steps[index + 1]?.id) ||
                      (completedSteps.includes(step.id) && steps[index + 1]?.id === currentStep)
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/25'
                      : 'bg-gray-600'
                      }`} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}