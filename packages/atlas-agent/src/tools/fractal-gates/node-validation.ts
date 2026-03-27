// Task 10c: validate_node — acceptance tests for a UniversalFractalNode

import type { UniversalFractalNode } from "../../types/index.js";

export interface ValidationTest {
  hypothesis: string;
  expected_improvement: string;
  metric: string;
  threshold: string;
  validation_method: string;
  pass: boolean;
}

export interface NodeValidationResult {
  tests: ValidationTest[];
  overall_valid: boolean;
  issues: string[];
}

export function handleValidateNode(node: UniversalFractalNode): NodeValidationResult {
  const tests: ValidationTest[] = [];
  const issues: string[] = [];

  // Test 1: Node has non-empty identity.name
  const hasName = node.identity.name.trim().length > 0;
  tests.push({
    hypothesis: "Node has a non-empty name",
    expected_improvement: "Node is identifiable",
    metric: "name_length",
    threshold: "> 0",
    validation_method: "string_length_check",
    pass: hasName,
  });
  if (!hasName) issues.push("Node identity.name is empty");

  // Test 2: Node has at least one output
  const hasOutputs = node.io.outputs.length > 0;
  tests.push({
    hypothesis: "Node has at least one output",
    expected_improvement: "Node produces deliverables",
    metric: "output_count",
    threshold: ">= 1",
    validation_method: "array_length_check",
    pass: hasOutputs,
  });
  if (!hasOutputs) issues.push("Node has no outputs — every node must produce at least one output");

  // Test 3: Node has non-empty purpose
  const hasPurpose = node.purpose_context.purpose.trim().length > 0;
  tests.push({
    hypothesis: "Node has a non-empty purpose",
    expected_improvement: "Node has clear intent",
    metric: "purpose_length",
    threshold: "> 0",
    validation_method: "string_length_check",
    pass: hasPurpose,
  });
  if (!hasPurpose) issues.push("Node purpose_context.purpose is empty");

  // Test 4: Node has structural_npv.recommendation = "create"
  const hasCreateRecommendation = node.structural_npv.recommendation === "create";
  tests.push({
    hypothesis: "Node has NPV recommendation of 'create'",
    expected_improvement: "Node justified by positive NPV",
    metric: "npv_recommendation",
    threshold: "= create",
    validation_method: "enum_check",
    pass: hasCreateRecommendation,
  });
  if (!hasCreateRecommendation)
    issues.push(`Node NPV recommendation is "${node.structural_npv.recommendation}", expected "create"`);

  // Test 5: Node has at least one tool if type is "agent" (warning only for non-agents)
  const isAgent = node.identity.type === "agent" || node.identity.type === "sub_agent";
  const hasTools = node.tools_memory_policies.tools.length > 0;
  if (isAgent) {
    tests.push({
      hypothesis: "Agent-type node has at least one tool",
      expected_improvement: "Agent can perform actions",
      metric: "tool_count",
      threshold: ">= 1",
      validation_method: "array_length_check",
      pass: hasTools,
    });
    if (!hasTools) issues.push("Agent-type node has no tools");
  } else {
    tests.push({
      hypothesis: "Non-agent node may optionally have tools",
      expected_improvement: "Tools are optional for non-agent nodes",
      metric: "tool_count",
      threshold: ">= 0",
      validation_method: "array_length_check",
      pass: true,
    });
  }

  return {
    tests,
    overall_valid: issues.length === 0,
    issues,
  };
}
