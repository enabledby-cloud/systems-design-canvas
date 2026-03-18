/**
 * Entity Templates Data
 * 
 * This file contains the large ENTITY_DATABASE constant and convenience exports.
 * It's designed to be dynamically imported to enable code-splitting.
 * 
 * @module data/entity-templates
 */

import {
  createSimpleTemplate,
  createCompositeTemplate,
  flattenCategories,
  getTemplateById,
  instantiateEntity,
  type EntityCategory,
  type EntityTemplate,
} from './entity-database';
import type { SystemNode } from '@/types';

/**
 * The master entity database organized by hierarchical categories.
 * Based on systems thinking principles from Donella Meadows' "Thinking in Systems".
 */
export const ENTITY_DATABASE: EntityCategory[] = [
  // -------------------------------------------------------------------------
  // STOCKS & FLOWS - The fundamental building blocks of systems
  // -------------------------------------------------------------------------
  {
    id: 'stocks_flows',
    name: 'Stocks & Flows',
    description: 'Fundamental building blocks: accumulations and rates of change',
    icon: 'box',
    templates: [
      createSimpleTemplate('stock', 'Stock', 'Accumulate', 'Resources', {
        description: 'An accumulation—the foundation of any system. Stocks change over time through flows.',
        inputs: [{ name: 'Inflow' }],
        outputs: [{ name: 'Outflow' }],
        tags: ['stock', 'accumulation', 'reservoir', 'level', 'fundamental'],
        emergence: 'System Memory',
      }),
      createSimpleTemplate('inflow', 'Inflow', 'Increase', 'Stock', {
        description: 'A rate that adds to a stock over time. The faucet that fills the bathtub.',
        inputs: [{ name: 'Source' }],
        outputs: [{ name: 'To Stock' }],
        tags: ['inflow', 'rate', 'increase', 'add', 'flow'],
      }),
      createSimpleTemplate('outflow', 'Outflow', 'Decrease', 'Stock', {
        description: 'A rate that drains from a stock over time. The drain that empties the bathtub.',
        inputs: [{ name: 'From Stock' }],
        outputs: [{ name: 'Sink' }],
        tags: ['outflow', 'rate', 'decrease', 'drain', 'flow'],
      }),
      createSimpleTemplate('converter', 'Converter', 'Transform', 'Flow', {
        description: 'Transforms one type of flow into another without accumulation.',
        inputs: [{ name: 'Input Flow' }],
        outputs: [{ name: 'Output Flow' }],
        tags: ['converter', 'transform', 'process', 'flow'],
      }),
      createSimpleTemplate('source', 'Source', 'Generate', 'Flow', {
        isExternal: true,
        description: 'An external origin of flows—assumed infinite or outside the system boundary.',
        inputs: [],
        outputs: [{ name: 'Output' }],
        tags: ['source', 'origin', 'external', 'boundary'],
      }),
      createSimpleTemplate('sink', 'Sink', 'Absorb', 'Flow', {
        isExternal: true,
        description: 'An external destination for flows—assumed infinite capacity, outside the boundary.',
        inputs: [{ name: 'Input' }],
        outputs: [],
        tags: ['sink', 'destination', 'external', 'boundary'],
      }),
    ],
    subcategories: [
      {
        id: 'stock_types',
        name: 'Stock Types',
        description: 'Common types of stocks in systems',
        templates: [
          createSimpleTemplate('inventory', 'Inventory', 'Store', 'Goods', {
            description: 'Physical goods accumulation—products, materials, supplies.',
            inputs: [{ name: 'Deliveries' }],
            outputs: [{ name: 'Shipments' }],
            tags: ['inventory', 'goods', 'materials', 'physical', 'stock'],
          }),
          createSimpleTemplate('population', 'Population', 'Contain', 'Entities', {
            description: 'A count of entities—people, animals, bacteria, items.',
            inputs: [{ name: 'Births/Arrivals' }],
            outputs: [{ name: 'Deaths/Departures' }],
            tags: ['population', 'count', 'demographics', 'stock'],
          }),
          createSimpleTemplate('capital', 'Capital', 'Hold', 'Value', {
            description: 'Financial or physical capital accumulation.',
            inputs: [{ name: 'Investment' }],
            outputs: [{ name: 'Depreciation' }],
            tags: ['capital', 'money', 'investment', 'financial', 'stock'],
          }),
          createSimpleTemplate('knowledge', 'Knowledge Base', 'Accumulate', 'Knowledge', {
            description: 'Accumulated information, skills, or organizational learning.',
            inputs: [{ name: 'Learning' }],
            outputs: [{ name: 'Forgetting' }],
            tags: ['knowledge', 'learning', 'information', 'skills', 'stock'],
          }),
          createSimpleTemplate('trust', 'Trust/Reputation', 'Build', 'Trust', {
            description: 'Intangible stock of trust, reputation, or social capital.',
            inputs: [{ name: 'Trust Building' }],
            outputs: [{ name: 'Trust Erosion' }],
            tags: ['trust', 'reputation', 'social', 'intangible', 'stock'],
          }),
          createSimpleTemplate('backlog', 'Backlog/Queue', 'Queue', 'Items', {
            description: 'Work waiting to be processed—orders, tasks, requests.',
            inputs: [{ name: 'Arrivals' }],
            outputs: [{ name: 'Completions' }],
            tags: ['backlog', 'queue', 'work', 'waiting', 'stock'],
          }),
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // FEEDBACK STRUCTURES - The behavior shapers
  // -------------------------------------------------------------------------
  {
    id: 'feedback',
    name: 'Feedback Structures',
    description: 'Loops that drive system behavior: balancing and reinforcing',
    icon: 'brain',
    templates: [],
    subcategories: [
      {
        id: 'balancing_loops',
        name: 'Balancing Loops',
        description: 'Goal-seeking, stabilizing feedback (negative feedback)',
        templates: [
          createSimpleTemplate('goal', 'Goal/Target', 'Define', 'Desired State', {
            description: 'The desired state that a balancing loop seeks to achieve.',
            inputs: [{ name: 'External Input' }],
            outputs: [{ name: 'Reference Signal' }],
            tags: ['goal', 'target', 'setpoint', 'desired', 'balancing'],
          }),
          createSimpleTemplate('comparator', 'Comparator', 'Compare', 'States', {
            description: 'Compares actual state to goal, producing a discrepancy signal.',
            inputs: [{ name: 'Actual State' }, { name: 'Goal State' }],
            outputs: [{ name: 'Discrepancy' }],
            tags: ['comparator', 'gap', 'discrepancy', 'difference', 'balancing'],
          }),
          createSimpleTemplate('corrective_action', 'Corrective Action', 'Adjust', 'Flow', {
            description: 'Action taken to reduce the gap between actual and desired state.',
            inputs: [{ name: 'Discrepancy' }],
            outputs: [{ name: 'Adjustment' }],
            tags: ['corrective', 'action', 'adjustment', 'control', 'balancing'],
          }),
          createCompositeTemplate(
            'thermostat_loop',
            'Thermostat Pattern',
            'Regulate',
            'State',
            {
              nodes: [
                createSimpleTemplate('goal_node', 'Desired Temp', 'Set', 'Target', {
                  inputs: [{ name: 'Setting' }],
                  outputs: [{ name: 'Target' }],
                }),
                createSimpleTemplate('sensor_node', 'Sensor', 'Measure', 'State', {
                  inputs: [{ name: 'Actual' }],
                  outputs: [{ name: 'Reading' }],
                }),
                createSimpleTemplate('controller', 'Controller', 'Decide', 'Action', {
                  inputs: [{ name: 'Target' }, { name: 'Reading' }],
                  outputs: [{ name: 'Command' }],
                }),
              ],
              edges: [
                { fromNode: 'BOUNDARY_IN', fromPortIndex: 0, toNode: 'goal_node', toPortIndex: 0, interaction: 'Sets' },
                { fromNode: 'goal_node', fromPortIndex: 0, toNode: 'controller', toPortIndex: 0, interaction: 'Reference' },
                { fromNode: 'sensor_node', fromPortIndex: 0, toNode: 'controller', toPortIndex: 1, interaction: 'Feedback' },
                { fromNode: 'controller', fromPortIndex: 0, toNode: 'BOUNDARY_OUT', toPortIndex: 0, interaction: 'Controls' },
              ],
            },
            {
              description: 'Classic balancing loop: sense → compare → adjust (like a thermostat)',
              inputs: [{ name: 'Goal Setting' }],
              outputs: [{ name: 'Control Signal' }],
              tags: ['thermostat', 'regulation', 'control', 'balancing', 'archetype'],
              emergence: 'Homeostasis',
            }
          ),
        ],
      },
      {
        id: 'reinforcing_loops',
        name: 'Reinforcing Loops',
        description: 'Amplifying, exponential feedback (positive feedback)',
        templates: [
          createSimpleTemplate('growth_engine', 'Growth Engine', 'Amplify', 'Growth', {
            description: 'A reinforcing mechanism where success breeds more success.',
            inputs: [{ name: 'Current State' }],
            outputs: [{ name: 'Amplified Effect' }],
            tags: ['growth', 'reinforcing', 'amplify', 'compound', 'exponential'],
          }),
          createSimpleTemplate('virtuous_cycle', 'Virtuous Cycle', 'Reinforce', 'Positive', {
            description: 'Positive reinforcing loop—the more you have, the more you get.',
            inputs: [{ name: 'Input' }],
            outputs: [{ name: 'Amplified Output' }],
            tags: ['virtuous', 'positive', 'reinforcing', 'growth'],
          }),
          createSimpleTemplate('vicious_cycle', 'Vicious Cycle', 'Reinforce', 'Negative', {
            description: 'Negative reinforcing loop—decline accelerates decline.',
            inputs: [{ name: 'Input' }],
            outputs: [{ name: 'Worsened Output' }],
            tags: ['vicious', 'decline', 'reinforcing', 'collapse'],
          }),
          createCompositeTemplate(
            'compound_growth',
            'Compound Growth',
            'Generate',
            'Exponential Change',
            {
              nodes: [
                createSimpleTemplate('stock_inner', 'Stock', 'Accumulate', 'Value', {
                  inputs: [{ name: 'Addition' }],
                  outputs: [{ name: 'Current Level' }],
                }),
                createSimpleTemplate('growth_rate', 'Growth Rate', 'Calculate', 'Addition', {
                  inputs: [{ name: 'Current Level' }],
                  outputs: [{ name: 'Growth Amount' }],
                }),
              ],
              edges: [
                { fromNode: 'BOUNDARY_IN', fromPortIndex: 0, toNode: 'stock_inner', toPortIndex: 0, interaction: 'Seeds' },
                { fromNode: 'stock_inner', fromPortIndex: 0, toNode: 'growth_rate', toPortIndex: 0, interaction: 'Drives' },
                { fromNode: 'growth_rate', fromPortIndex: 0, toNode: 'BOUNDARY_OUT', toPortIndex: 0, interaction: 'Outputs' },
              ],
            },
            {
              description: 'Exponential growth: the bigger the stock, the bigger the inflow',
              inputs: [{ name: 'Initial Value' }],
              outputs: [{ name: 'Growth' }],
              tags: ['compound', 'exponential', 'interest', 'growth', 'reinforcing'],
              emergence: 'Exponential Behavior',
            }
          ),
        ],
      },
      {
        id: 'delays',
        name: 'Delays',
        description: 'Time lags that cause oscillation and overshoot',
        templates: [
          createSimpleTemplate('delay', 'Delay', 'Lag', 'Signal', {
            description: 'Time lag between an action and its effect—causes oscillation.',
            inputs: [{ name: 'Input' }],
            outputs: [{ name: 'Delayed Output' }],
            tags: ['delay', 'lag', 'time', 'oscillation'],
          }),
          createSimpleTemplate('info_delay', 'Information Delay', 'Delay', 'Information', {
            description: 'Lag in information flow—you act on old data.',
            inputs: [{ name: 'Current State' }],
            outputs: [{ name: 'Perceived State' }],
            tags: ['information', 'delay', 'perception', 'lag'],
          }),
          createSimpleTemplate('material_delay', 'Material Delay', 'Delay', 'Physical Flow', {
            description: 'Lag in physical flows—pipeline delays, shipping time.',
            inputs: [{ name: 'Shipment' }],
            outputs: [{ name: 'Delivery' }],
            tags: ['material', 'physical', 'pipeline', 'delay'],
          }),
          createSimpleTemplate('buffer', 'Buffer', 'Smooth', 'Flow', {
            description: 'A stock used to absorb variation between inflow and outflow rates.',
            inputs: [{ name: 'Variable Inflow' }],
            outputs: [{ name: 'Steady Outflow' }],
            tags: ['buffer', 'smoothing', 'inventory', 'variation'],
          }),
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // SYSTEM ARCHETYPES - Common patterns from "Thinking in Systems"
  // -------------------------------------------------------------------------
  {
    id: 'archetypes',
    name: 'System Archetypes',
    description: 'Common system patterns that produce predictable behaviors',
    icon: 'brain',
    templates: [],
    subcategories: [
      {
        id: 'limits_patterns',
        name: 'Limits & Constraints',
        description: 'Patterns involving growth limits and constraints',
        templates: [
          createSimpleTemplate('limit', 'Limiting Factor', 'Constrain', 'Growth', {
            description: 'A constraint that eventually stops or slows growth.',
            inputs: [{ name: 'Growth Pressure' }],
            outputs: [{ name: 'Limited Output' }],
            tags: ['limit', 'constraint', 'ceiling', 'carrying-capacity'],
          }),
          createSimpleTemplate('carrying_capacity', 'Carrying Capacity', 'Bound', 'Population', {
            description: 'Maximum sustainable level—environmental or resource limit.',
            inputs: [{ name: 'Current Level' }],
            outputs: [{ name: 'Constraint Signal' }],
            tags: ['carrying-capacity', 'sustainability', 'maximum', 'environment'],
          }),
          createCompositeTemplate(
            'limits_to_growth',
            'Limits to Growth',
            'Exhibit',
            'S-Curve',
            {
              nodes: [
                createSimpleTemplate('growing_stock', 'Growing Stock', 'Grow', 'Exponentially', {
                  inputs: [{ name: 'Growth' }],
                  outputs: [{ name: 'Level' }],
                }),
                createSimpleTemplate('reinforcing', 'Reinforcing Loop', 'Amplify', 'Growth', {
                  inputs: [{ name: 'Level' }],
                  outputs: [{ name: 'More Growth' }],
                }),
                createSimpleTemplate('limiting', 'Limiting Factor', 'Slow', 'Growth', {
                  inputs: [{ name: 'Level' }],
                  outputs: [{ name: 'Constraint' }],
                }),
              ],
              edges: [
                { fromNode: 'BOUNDARY_IN', fromPortIndex: 0, toNode: 'growing_stock', toPortIndex: 0, interaction: 'Seeds' },
                { fromNode: 'growing_stock', fromPortIndex: 0, toNode: 'reinforcing', toPortIndex: 0, interaction: 'Drives' },
                { fromNode: 'growing_stock', fromPortIndex: 0, toNode: 'limiting', toPortIndex: 0, interaction: 'Approaches' },
                { fromNode: 'limiting', fromPortIndex: 0, toNode: 'BOUNDARY_OUT', toPortIndex: 0, interaction: 'Signals' },
              ],
            },
            {
              description: 'Archetype: Growth slows as it approaches a limit (S-curve behavior)',
              inputs: [{ name: 'Initial Condition' }],
              outputs: [{ name: 'Limit Signal' }],
              tags: ['limits-to-growth', 'archetype', 's-curve', 'constraint'],
              emergence: 'Sigmoidal Growth',
            }
          ),
        ],
      },
      {
        id: 'shifting_patterns',
        name: 'Burden & Addiction',
        description: 'Patterns of dependency and problem displacement',
        templates: [
          createSimpleTemplate('symptom', 'Symptom', 'Indicate', 'Problem', {
            description: 'A visible sign of an underlying problem.',
            inputs: [{ name: 'Problem State' }],
            outputs: [{ name: 'Visible Signal' }],
            tags: ['symptom', 'indicator', 'signal', 'problem'],
          }),
          createSimpleTemplate('quick_fix', 'Quick Fix', 'Address', 'Symptom', {
            description: 'A fast solution that addresses symptoms, not root cause.',
            inputs: [{ name: 'Symptom' }],
            outputs: [{ name: 'Temporary Relief' }],
            tags: ['quick-fix', 'symptomatic', 'workaround', 'temporary'],
          }),
          createSimpleTemplate('fundamental_solution', 'Fundamental Solution', 'Address', 'Root Cause', {
            description: 'A slower solution that addresses the underlying problem.',
            inputs: [{ name: 'Root Cause' }],
            outputs: [{ name: 'Lasting Resolution' }],
            tags: ['fundamental', 'root-cause', 'sustainable', 'solution'],
          }),
          createSimpleTemplate('side_effect', 'Side Effect', 'Create', 'Unintended Consequence', {
            description: 'Unintended consequence of an action that affects the system.',
            inputs: [{ name: 'Action' }],
            outputs: [{ name: 'Consequence' }],
            tags: ['side-effect', 'unintended', 'consequence', 'spillover'],
          }),
          createCompositeTemplate(
            'shifting_burden',
            'Shifting the Burden',
            'Displace',
            'Problem',
            {
              nodes: [
                createSimpleTemplate('problem', 'Problem', 'Create', 'Symptoms', {
                  inputs: [{ name: 'Root Cause' }],
                  outputs: [{ name: 'Symptom' }],
                }),
                createSimpleTemplate('quick', 'Quick Fix', 'Relieve', 'Symptom', {
                  inputs: [{ name: 'Symptom' }],
                  outputs: [{ name: 'Temporary Relief' }],
                }),
                createSimpleTemplate('addiction', 'Addiction', 'Reduce', 'Capability', {
                  inputs: [{ name: 'Reliance' }],
                  outputs: [{ name: 'Weakened Ability' }],
                }),
              ],
              edges: [
                { fromNode: 'BOUNDARY_IN', fromPortIndex: 0, toNode: 'problem', toPortIndex: 0, interaction: 'Causes' },
                { fromNode: 'problem', fromPortIndex: 0, toNode: 'quick', toPortIndex: 0, interaction: 'Triggers' },
                { fromNode: 'quick', fromPortIndex: 0, toNode: 'addiction', toPortIndex: 0, interaction: 'Creates' },
                { fromNode: 'addiction', fromPortIndex: 0, toNode: 'BOUNDARY_OUT', toPortIndex: 0, interaction: 'Erodes' },
              ],
            },
            {
              description: 'Archetype: Quick fixes create dependency and erode ability to solve the real problem',
              inputs: [{ name: 'Problem Trigger' }],
              outputs: [{ name: 'Eroded Capability' }],
              tags: ['shifting-burden', 'archetype', 'addiction', 'dependency'],
              emergence: 'Growing Dependency',
            }
          ),
        ],
      },
      {
        id: 'competition_patterns',
        name: 'Competition & Commons',
        description: 'Patterns of resource competition and shared resource depletion',
        templates: [
          createSimpleTemplate('shared_resource', 'Shared Resource', 'Provide', 'Common Pool', {
            description: 'A resource accessible to multiple actors—can be depleted.',
            inputs: [{ name: 'Regeneration' }],
            outputs: [{ name: 'Extraction' }],
            tags: ['commons', 'shared', 'resource', 'depletion'],
          }),
          createSimpleTemplate('competitor', 'Competitor', 'Extract', 'Resource', {
            description: 'An actor competing for shared resources.',
            inputs: [{ name: 'Resource Access' }],
            outputs: [{ name: 'Benefit' }],
            tags: ['competitor', 'actor', 'extraction', 'rivalry'],
          }),
          createSimpleTemplate('escalation_actor', 'Escalating Actor', 'React', 'To Threat', {
            description: 'An actor in an escalation dynamic—arms race behavior.',
            inputs: [{ name: 'Perceived Threat' }],
            outputs: [{ name: 'Counter-Action' }],
            tags: ['escalation', 'arms-race', 'reaction', 'competition'],
          }),
          createCompositeTemplate(
            'tragedy_commons',
            'Tragedy of the Commons',
            'Deplete',
            'Shared Resource',
            {
              nodes: [
                createSimpleTemplate('commons', 'Common Resource', 'Hold', 'Shared Pool', {
                  inputs: [{ name: 'Regeneration' }],
                  outputs: [{ name: 'Level' }],
                }),
                createSimpleTemplate('actor_a', 'Actor A', 'Extract', 'Benefit', {
                  inputs: [{ name: 'Access' }],
                  outputs: [{ name: 'Extraction' }],
                }),
                createSimpleTemplate('actor_b', 'Actor B', 'Extract', 'Benefit', {
                  inputs: [{ name: 'Access' }],
                  outputs: [{ name: 'Extraction' }],
                }),
              ],
              edges: [
                { fromNode: 'BOUNDARY_IN', fromPortIndex: 0, toNode: 'commons', toPortIndex: 0, interaction: 'Replenishes' },
                { fromNode: 'commons', fromPortIndex: 0, toNode: 'actor_a', toPortIndex: 0, interaction: 'Provides' },
                { fromNode: 'commons', fromPortIndex: 0, toNode: 'actor_b', toPortIndex: 0, interaction: 'Provides' },
                { fromNode: 'actor_a', fromPortIndex: 0, toNode: 'BOUNDARY_OUT', toPortIndex: 0, interaction: 'Depletes' },
              ],
            },
            {
              description: 'Archetype: Individual rational behavior depletes shared resource',
              inputs: [{ name: 'Resource Regeneration' }],
              outputs: [{ name: 'Depletion Rate' }],
              tags: ['tragedy-commons', 'archetype', 'depletion', 'shared-resource'],
              emergence: 'Resource Collapse',
            }
          ),
        ],
      },
      {
        id: 'erosion_patterns',
        name: 'Goals & Erosion',
        description: 'Patterns of drifting goals and eroding standards',
        templates: [
          createSimpleTemplate('perceived_state', 'Perceived State', 'Perceive', 'Reality', {
            description: 'The actor\'s perception of current conditions (may differ from actual).',
            inputs: [{ name: 'Actual State' }],
            outputs: [{ name: 'Perception' }],
            tags: ['perception', 'mental-model', 'belief', 'state'],
          }),
          createSimpleTemplate('eroding_goal', 'Eroding Goal', 'Drift', 'Downward', {
            description: 'A goal that is adjusted downward when not met, instead of improving performance.',
            inputs: [{ name: 'Performance Gap' }],
            outputs: [{ name: 'Lowered Standard' }],
            tags: ['erosion', 'goal', 'drift', 'standards'],
          }),
          createSimpleTemplate('success_criterion', 'Success Criterion', 'Define', 'Success', {
            description: 'The standard by which success or failure is judged.',
            inputs: [{ name: 'Context' }],
            outputs: [{ name: 'Threshold' }],
            tags: ['success', 'criterion', 'standard', 'threshold'],
          }),
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // INFORMATION & CONTROL - The nervous system of systems
  // -------------------------------------------------------------------------
  {
    id: 'information',
    name: 'Information & Control',
    description: 'Sensing, decision-making, and control elements',
    icon: 'brain',
    templates: [
      createSimpleTemplate('sensor', 'Sensor', 'Measure', 'State', {
        description: 'Measures some aspect of the system\'s state.',
        inputs: [{ name: 'System State' }],
        outputs: [{ name: 'Measurement' }],
        tags: ['sensor', 'measure', 'monitor', 'observe'],
      }),
      createSimpleTemplate('indicator', 'Indicator', 'Signal', 'Condition', {
        description: 'A visible signal that communicates system state.',
        inputs: [{ name: 'State' }],
        outputs: [{ name: 'Signal' }],
        tags: ['indicator', 'signal', 'dashboard', 'metric'],
      }),
      createSimpleTemplate('decision_maker', 'Decision Maker', 'Decide', 'Action', {
        description: 'An entity that interprets information and chooses actions.',
        inputs: [{ name: 'Information' }],
        outputs: [{ name: 'Decision' }],
        tags: ['decision', 'choice', 'actor', 'control'],
      }),
      createSimpleTemplate('rule', 'Rule/Policy', 'Govern', 'Behavior', {
        description: 'A constraint or guideline that shapes system behavior.',
        inputs: [{ name: 'Situation' }],
        outputs: [{ name: 'Prescribed Action' }],
        tags: ['rule', 'policy', 'constraint', 'governance'],
      }),
      createSimpleTemplate('mental_model', 'Mental Model', 'Represent', 'Understanding', {
        description: 'An actor\'s internal representation of how the system works.',
        inputs: [{ name: 'Experience' }],
        outputs: [{ name: 'Expectations' }],
        tags: ['mental-model', 'belief', 'understanding', 'paradigm'],
      }),
    ],
    subcategories: [
      {
        id: 'leverage_points',
        name: 'Leverage Points',
        description: 'Places to intervene in a system (from Meadows\' hierarchy)',
        templates: [
          createSimpleTemplate('parameter', 'Parameter', 'Adjust', 'Value', {
            description: 'Numbers like tax rates, standards—low leverage but easy to change.',
            inputs: [{ name: 'Policy Input' }],
            outputs: [{ name: 'Adjusted Value' }],
            tags: ['parameter', 'number', 'constant', 'leverage-low'],
          }),
          createSimpleTemplate('buffer_size', 'Buffer Size', 'Set', 'Capacity', {
            description: 'The size of stabilizing stocks—moderate leverage.',
            inputs: [{ name: 'Design Choice' }],
            outputs: [{ name: 'Stability' }],
            tags: ['buffer', 'capacity', 'size', 'leverage-medium'],
          }),
          createSimpleTemplate('feedback_strength', 'Feedback Strength', 'Tune', 'Loop Gain', {
            description: 'The strength of feedback loops—significant leverage.',
            inputs: [{ name: 'Tuning Input' }],
            outputs: [{ name: 'Loop Effectiveness' }],
            tags: ['feedback', 'gain', 'strength', 'leverage-high'],
          }),
          createSimpleTemplate('system_goal', 'System Goal', 'Set', 'Purpose', {
            description: 'The purpose or function of the system—high leverage.',
            inputs: [{ name: 'Vision' }],
            outputs: [{ name: 'Direction' }],
            tags: ['goal', 'purpose', 'direction', 'leverage-high'],
          }),
          createSimpleTemplate('paradigm', 'Paradigm', 'Shape', 'Worldview', {
            description: 'The mindset or worldview from which the system arises—highest leverage.',
            inputs: [{ name: 'Insight' }],
            outputs: [{ name: 'New Understanding' }],
            tags: ['paradigm', 'mindset', 'worldview', 'leverage-highest'],
          }),
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // ACTORS & AGENTS - The entities that act within systems
  // -------------------------------------------------------------------------
  {
    id: 'actors',
    name: 'Actors & Agents',
    description: 'People, organizations, and entities that participate in systems',
    icon: 'briefcase',
    templates: [
      createSimpleTemplate('actor', 'Actor', 'Participate', 'In System', {
        description: 'A person or entity that takes actions within the system.',
        inputs: [{ name: 'Information' }],
        outputs: [{ name: 'Action' }],
        tags: ['actor', 'agent', 'participant', 'person'],
      }),
      createSimpleTemplate('external_actor', 'External Actor', 'Interact', 'With System', {
        isExternal: true,
        description: 'An actor outside the system boundary that interacts with it.',
        inputs: [{ name: 'System Output' }],
        outputs: [{ name: 'System Input' }],
        tags: ['external', 'actor', 'boundary', 'environment'],
      }),
      createSimpleTemplate('organization', 'Organization', 'Coordinate', 'Actors', {
        description: 'A group of actors with shared purpose and structure.',
        inputs: [{ name: 'Resources' }],
        outputs: [{ name: 'Collective Action' }],
        tags: ['organization', 'group', 'institution', 'collective'],
      }),
      createSimpleTemplate('customer', 'Customer', 'Demand', 'Value', {
        isExternal: true,
        description: 'External actor who receives value from the system.',
        inputs: [{ name: 'Product/Service' }],
        outputs: [{ name: 'Payment/Feedback' }],
        tags: ['customer', 'user', 'consumer', 'external'],
      }),
      createSimpleTemplate('supplier', 'Supplier', 'Provide', 'Inputs', {
        isExternal: true,
        description: 'External actor who provides inputs to the system.',
        inputs: [{ name: 'Orders' }],
        outputs: [{ name: 'Supplies' }],
        tags: ['supplier', 'vendor', 'provider', 'external'],
      }),
      createSimpleTemplate('regulator', 'Regulator', 'Enforce', 'Rules', {
        isExternal: true,
        description: 'External actor that sets and enforces rules/constraints.',
        inputs: [{ name: 'Compliance Data' }],
        outputs: [{ name: 'Regulations' }],
        tags: ['regulator', 'government', 'authority', 'external'],
      }),
    ],
  },

  // -------------------------------------------------------------------------
  // TECHNICAL IMPLEMENTATION - Software & infrastructure as system elements
  // -------------------------------------------------------------------------
  {
    id: 'technical',
    name: 'Technical Systems',
    description: 'Software and infrastructure viewed through systems thinking',
    icon: 'code',
    templates: [],
    subcategories: [
      {
        id: 'data_stocks',
        name: 'Data Stocks',
        description: 'Data storage as system stocks',
        templates: [
          createSimpleTemplate('database', 'Database', 'Persist', 'Data', {
            description: 'Data stock—accumulates and provides records.',
            inputs: [{ name: 'Write' }],
            outputs: [{ name: 'Read' }],
            tags: ['database', 'storage', 'stock', 'persistence'],
          }),
          createSimpleTemplate('cache', 'Cache', 'Buffer', 'Data', {
            description: 'Temporary data stock for speed—buffer between flows.',
            inputs: [{ name: 'Store' }],
            outputs: [{ name: 'Retrieve' }],
            tags: ['cache', 'buffer', 'temporary', 'stock'],
          }),
          createSimpleTemplate('queue', 'Message Queue', 'Buffer', 'Messages', {
            description: 'Stock of messages waiting to be processed.',
            inputs: [{ name: 'Enqueue' }],
            outputs: [{ name: 'Dequeue' }],
            tags: ['queue', 'buffer', 'messages', 'stock'],
          }),
          createSimpleTemplate('event_store', 'Event Store', 'Accumulate', 'Events', {
            description: 'Immutable stock of system events—audit trail.',
            inputs: [{ name: 'Event' }],
            outputs: [{ name: 'Event Stream' }],
            tags: ['events', 'log', 'audit', 'stock'],
          }),
        ],
      },
      {
        id: 'processing_flows',
        name: 'Processing Flows',
        description: 'Computation and transformation as flows',
        templates: [
          createSimpleTemplate('service', 'Service', 'Process', 'Requests', {
            description: 'Processing flow—transforms inputs to outputs.',
            inputs: [{ name: 'Request' }],
            outputs: [{ name: 'Response' }],
            tags: ['service', 'api', 'processing', 'flow'],
          }),
          createSimpleTemplate('transformer', 'Transformer', 'Transform', 'Data', {
            description: 'Converts data from one form to another.',
            inputs: [{ name: 'Input' }],
            outputs: [{ name: 'Output' }],
            tags: ['transform', 'convert', 'map', 'flow'],
          }),
          createSimpleTemplate('validator', 'Validator', 'Check', 'Validity', {
            description: 'Flow that filters based on rules.',
            inputs: [{ name: 'Input' }],
            outputs: [{ name: 'Valid' }, { name: 'Invalid' }],
            tags: ['validate', 'filter', 'check', 'flow'],
          }),
          createSimpleTemplate('aggregator', 'Aggregator', 'Combine', 'Flows', {
            description: 'Combines multiple flows into one.',
            inputs: [{ name: 'Flow A' }, { name: 'Flow B' }],
            outputs: [{ name: 'Combined' }],
            tags: ['aggregate', 'combine', 'merge', 'flow'],
          }),
        ],
      },
      {
        id: 'feedback_tech',
        name: 'Technical Feedback',
        description: 'Monitoring and control systems',
        templates: [
          createSimpleTemplate('monitor', 'Monitor', 'Observe', 'Metrics', {
            description: 'Sensor for system health—provides feedback.',
            inputs: [{ name: 'System Metrics' }],
            outputs: [{ name: 'Health Status' }],
            tags: ['monitor', 'metrics', 'observability', 'sensor'],
          }),
          createSimpleTemplate('alerter', 'Alerter', 'Notify', 'Issues', {
            description: 'Triggers when thresholds are crossed—balancing feedback.',
            inputs: [{ name: 'Metrics' }],
            outputs: [{ name: 'Alert' }],
            tags: ['alert', 'notification', 'threshold', 'feedback'],
          }),
          createSimpleTemplate('autoscaler', 'Auto-Scaler', 'Adjust', 'Capacity', {
            description: 'Balancing loop for infrastructure—adjusts to demand.',
            inputs: [{ name: 'Load' }],
            outputs: [{ name: 'Scale Command' }],
            tags: ['autoscaling', 'elastic', 'balancing', 'feedback'],
          }),
          createSimpleTemplate('circuit_breaker', 'Circuit Breaker', 'Protect', 'System', {
            description: 'Balancing mechanism that prevents cascade failures.',
            inputs: [{ name: 'Error Rate' }],
            outputs: [{ name: 'Open/Closed' }],
            tags: ['circuit-breaker', 'resilience', 'protection', 'balancing'],
          }),
        ],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // GENERIC / CUSTOMIZABLE
  // -------------------------------------------------------------------------
  {
    id: 'generic',
    name: 'Generic',
    description: 'Customizable elements for any system',
    icon: 'box',
    templates: [
      createSimpleTemplate('generic_entity', 'Entity', 'Perform', 'Function', {
        description: 'Generic entity—customize name, process, and operand.',
        inputs: [{ name: 'Input' }],
        outputs: [{ name: 'Output' }],
        tags: ['generic', 'custom', 'blank', 'entity'],
      }),
      createSimpleTemplate('generic_stock', 'Stock', 'Accumulate', 'Something', {
        description: 'Generic stock—customize what accumulates.',
        inputs: [{ name: 'Inflow' }],
        outputs: [{ name: 'Outflow' }],
        tags: ['generic', 'stock', 'accumulation', 'blank'],
      }),
      createSimpleTemplate('generic_flow', 'Flow', 'Transfer', 'Something', {
        description: 'Generic flow—customize what transfers.',
        inputs: [{ name: 'From' }],
        outputs: [{ name: 'To' }],
        tags: ['generic', 'flow', 'rate', 'blank'],
      }),
      createSimpleTemplate('generic_external', 'External Entity', 'Interact', 'With System', {
        isExternal: true,
        description: 'Generic external entity—outside the system boundary.',
        inputs: [{ name: 'Response' }],
        outputs: [{ name: 'Request' }],
        tags: ['generic', 'external', 'boundary', 'blank'],
      }),
      createSimpleTemplate('connector', 'Connector', 'Connect', 'Elements', {
        description: 'Passes information or material without transformation.',
        inputs: [{ name: 'In' }],
        outputs: [{ name: 'Out' }],
        tags: ['connector', 'passthrough', 'link', 'generic'],
      }),
      createSimpleTemplate('splitter', 'Splitter', 'Divide', 'Flow', {
        description: 'Splits one flow into multiple paths.',
        inputs: [{ name: 'Input' }],
        outputs: [{ name: 'Path A' }, { name: 'Path B' }],
        tags: ['splitter', 'branch', 'divide', 'generic'],
      }),
    ],
  },
];

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Quick access to all templates as a flat list.
 */
export const ALL_TEMPLATES = flattenCategories(ENTITY_DATABASE).map(({ template }) => template);

/**
 * Quick template lookup by ID.
 */
export function getTemplate(templateId: string): EntityTemplate | undefined {
  return getTemplateById(ENTITY_DATABASE, templateId);
}

/**
 * Creates a new entity from a template ID at the specified position.
 */
export function createEntityFromTemplate(
  templateId: string,
  x: number,
  y: number
): SystemNode | undefined {
  const template = getTemplate(templateId);
  if (!template) return undefined;

  const { node } = instantiateEntity(template, x, y);
  return node;
}
