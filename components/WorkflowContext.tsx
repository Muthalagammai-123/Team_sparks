'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type WorkflowState = {
    currentStep: string
    role: 'shipper' | 'carrier' | 'customer' | null
    status: 'pending' | 'negotiating' | 'completed'
}

interface WorkflowContextType {
    state: WorkflowState
    customerExpectations: any
    customerRatings: any[]
    shipperTerms: any
    carrierConstraints: any
    negotiationData: any
    isLoaded: boolean
    setCustomerExpectations: (data: any) => void
    addCustomerRating: (rating: any) => void
    setShipperTerms: (data: any) => void
    setCarrierConstraints: (data: any) => void
    setNegotiationData: (data: any) => void
    resetWorkflow: () => void
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined)

export function WorkflowProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<WorkflowState>({
        currentStep: 'role-selection',
        role: null,
        status: 'pending'
    })

    const [customerExpectations, setCustomerExpectationsState] = useState<any>(null)
    const [customerRatings, setCustomerRatingsState] = useState<any[]>([])
    const [shipperTerms, setShipperTermsState] = useState<any>(null)
    const [carrierConstraints, setCarrierConstraintsState] = useState<any>(null)
    const [negotiationData, setNegotiationDataState] = useState<any>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    // Sync with localStorage
    useEffect(() => {
        const saved = localStorage.getItem('negotiatex_workflow')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (parsed.state) setState(parsed.state)
                if (parsed.customerExpectations) setCustomerExpectationsState(parsed.customerExpectations)
                if (parsed.customerRatings) setCustomerRatingsState(parsed.customerRatings)
                if (parsed.shipperTerms) setShipperTermsState(parsed.shipperTerms)
                if (parsed.carrierConstraints) setCarrierConstraintsState(parsed.carrierConstraints)
                if (parsed.negotiationData) setNegotiationDataState(parsed.negotiationData)
            } catch (e) {
                console.error('Failed to parse workflow state', e)
            }
        }
        setIsLoaded(true)
    }, [])

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('negotiatex_workflow', JSON.stringify({
                state,
                customerExpectations,
                customerRatings,
                shipperTerms,
                carrierConstraints,
                negotiationData
            }))
        }
    }, [state, customerExpectations, customerRatings, shipperTerms, carrierConstraints, negotiationData, isLoaded])

    const setCustomerExpectations = (data: any) => setCustomerExpectationsState(data)
    const addCustomerRating = (rating: any) => setCustomerRatingsState(prev => [...prev, rating])
    const setShipperTerms = (data: any) => setShipperTermsState(data)
    const setCarrierConstraints = (data: any) => setCarrierConstraintsState(data)
    const setNegotiationData = (data: any) => setNegotiationDataState(data)

    const resetWorkflow = () => {
        localStorage.removeItem('negotiatex_workflow')
        setState({
            currentStep: 'role-selection',
            role: null,
            status: 'pending'
        })
        setCustomerExpectationsState(null)
        setCustomerRatingsState([])
        setShipperTermsState(null)
        setCarrierConstraintsState(null)
        setNegotiationDataState(null)
    }

    return (
        <WorkflowContext.Provider value={{
            state,
            customerExpectations,
            customerRatings,
            shipperTerms,
            carrierConstraints,
            negotiationData,
            isLoaded,
            setCustomerExpectations,
            addCustomerRating,
            setShipperTerms,
            setCarrierConstraints,
            setNegotiationData,
            resetWorkflow
        }}>
            {children}
        </WorkflowContext.Provider>
    )
}

export function useWorkflow() {
    const context = useContext(WorkflowContext)
    if (!context) throw new Error('useWorkflow must be used within WorkflowProvider')
    return context
}
