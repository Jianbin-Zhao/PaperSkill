import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { PortraitHero } from './portrait-hero';
import { PortraitLab } from './portrait-lab';
import { PortraitScene } from './portrait-scene';
import { SapiensComparison } from './sapiens-comparison';
import { WhySapiens2 } from './why-sapiens2';
import { AttentionStory } from './attention-story';
import { ResultsMatrix } from './results-matrix';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['portrait-hero'] = PortraitHero;
widgetRegistry['portrait-lab'] = PortraitLab;
widgetRegistry['portrait-scene'] = PortraitScene;
widgetRegistry['sapiens-comparison'] = SapiensComparison;
widgetRegistry['why-sapiens2'] = WhySapiens2;
widgetRegistry['attention-story'] = AttentionStory;
widgetRegistry['results-matrix'] = ResultsMatrix;
