import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { PaperPlaneLab } from './paper-plane-lab';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['paper-plane-lab'] = PaperPlaneLab;
