from enum import Enum
from typing import List, Dict, Optional
import time

class WorkflowStatus(Enum):
    PENDING_SHIPPER = "PENDING_SHIPPER"
    PENDING_CARRIER = "PENDING_CARRIER"
    AI_NEGOTIATING = "AI_NEGOTIATING"
    AWAITING_APPROVALS = "AWAITING_APPROVALS"
    COMPLETED = "COMPLETED"

class NotificationService:
    @staticmethod
    def notify_role(role: str, message: str):
        # In a real system, this would push to a websocket or email/SMS
        print(f"NOTIFICATION to {role.upper()}: {message}")
        return {"to": role, "message": message, "timestamp": time.time()}

class NegotiateXWorkflow:
    def __init__(self):
        self.state = WorkflowStatus.PENDING_SHIPPER
        self.data = {
            "customer": {},
            "shipper": {},
            "carrier": {},
            "ai_output": {}
        }
        self.approvals = {
            "customer": False,
            "shipper": False,
            "carrier": False
        }

    def submit_customer_intent(self, intent_data: Dict):
        self.data["customer"] = intent_data
        self.state = WorkflowStatus.PENDING_SHIPPER
        return NotificationService.notify_role("shipper", "New Business Intent submitted. Action required.")

    def submit_shipper_requirements(self, shipper_data: Dict):
        if not self.data["customer"]:
            return {"error": "Customer intent must be submitted first"}
        
        self.data["shipper"] = shipper_data
        self.state = WorkflowStatus.PENDING_CARRIER
        return NotificationService.notify_role("carrier", "Shipper requirements added. Please assess feasibility.")

    def submit_carrier_feasibility(self, carrier_data: Dict):
        if not self.data["shipper"]:
            return {"error": "Shipper requirements must be submitted first"}
        
        self.data["carrier"] = carrier_data
        self.state = WorkflowStatus.AI_NEGOTIATING
        # This would trigger the AI engine
        return NotificationService.notify_role("system", "All inputs received. AI Negotiation Engine starting.")

    def finalize_negotiation(self, ai_contract: Dict):
        self.data["ai_output"] = ai_contract
        self.state = WorkflowStatus.AWAITING_APPROVALS
        
        notifications = [
            NotificationService.notify_role("customer", "AI has generated a contract based on your intent."),
            NotificationService.notify_role("shipper", "AI negotiation complete. Review delivery and penalty terms."),
            NotificationService.notify_role("carrier", "AI negotiation complete. Review operational feasibility.")
        ]
        return notifications

    def approve_contract(self, role: str):
        if role not in self.approvals:
            return {"error": "Invalid role"}
        
        self.approvals[role] = True
        
        if all(self.approvals.values()):
            self.state = WorkflowStatus.COMPLETED
            return {"status": "FINALIZED", "message": "Contract fully executed by all parties."}
        
        return {"status": "PARTIAL", "message": f"Approval received from {role}."}

    def get_visible_data(self, role: str) -> Dict:
        """Role-based access control for workflow transparency."""
        vis_data = {}
        
        if role == "customer":
            # Customer sees intent and final AI output
            vis_data["intent"] = self.data["customer"]
            if self.state in [WorkflowStatus.AWAITING_APPROVALS, WorkflowStatus.COMPLETED]:
                vis_data["contract"] = self.data["ai_output"]
        
        elif role == "shipper":
            # Shipper sees Customer Intent (read-only) and their own reqs
            vis_data["customer_intent"] = self.data["customer"]
            vis_data["my_requirements"] = self.data["shipper"]
            if self.state in [WorkflowStatus.AWAITING_APPROVALS, WorkflowStatus.COMPLETED]:
                vis_data["contract"] = self.data["ai_output"]
                
        elif role == "carrier":
            # Carrier sees everything from Customer and Shipper to assess feasibility
            vis_data["customer_intent"] = self.data["customer"]
            vis_data["shipper_requirements"] = self.data["shipper"]
            vis_data["my_feasibility"] = self.data["carrier"]
            if self.state in [WorkflowStatus.AWAITING_APPROVALS, WorkflowStatus.COMPLETED]:
                vis_data["contract"] = self.data["ai_output"]
                
        return vis_data
