from typing import List, Optional
from pydantic import BaseModel, Field


class ChartParameter(BaseModel):
    name: str = Field(description="The name of the parameter")
    value: str = Field(
        description="The literal value as it appears in code, or 'computed' if derived"
    )
    parameter_type: str = Field(
        description="The type of parameter, e.g., 'color', 'title', 'figure_size', etc."
    )
    description: Optional[str] = Field(
        default=None, description="Optional description of the parameter"
    )


class ChartWizardResponse(BaseModel):
    parameters: List[ChartParameter] = Field(
        description="List of extracted chart parameters"
    )
