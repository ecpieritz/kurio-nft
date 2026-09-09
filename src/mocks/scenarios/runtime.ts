import {
  defaultMockScenarioId,
  isMockScenarioId,
  mockScenarios,
  type MockScenarioDefinition,
  type MockScenarioId,
} from '@/mocks/scenarios/definitions'

const SCENARIO_STORAGE_KEY = 'kurio:msw:scenario:v1'

let activeScenarioId: MockScenarioId | undefined
let requestSequence = 0

function readPersistedScenario(): MockScenarioId | undefined {
  try {
    const storedScenario = window.localStorage.getItem(SCENARIO_STORAGE_KEY)
    return isMockScenarioId(storedScenario) ? storedScenario : undefined
  } catch {
    return undefined
  }
}

function readScenarioFromUrl(): MockScenarioId | undefined {
  if (typeof window === 'undefined') return undefined

  const scenario = new URLSearchParams(window.location.search).get('mockScenario')
  return isMockScenarioId(scenario) ? scenario : undefined
}

function readConfiguredScenario(): MockScenarioId {
  const environmentScenario = import.meta.env.VITE_MOCK_SCENARIO

  return (
    readScenarioFromUrl() ??
    (isMockScenarioId(environmentScenario) ? environmentScenario : undefined) ??
    readPersistedScenario() ??
    defaultMockScenarioId
  )
}

function persistScenario(scenarioId: MockScenarioId): void {
  try {
    window.localStorage.setItem(SCENARIO_STORAGE_KEY, scenarioId)
  } catch {
    // Scenario selection still works for the active page without storage access.
  }
}

export function getActiveScenario(): MockScenarioDefinition {
  activeScenarioId ??= readConfiguredScenario()
  return mockScenarios[activeScenarioId]
}

export function setActiveScenario(scenarioId: MockScenarioId): MockScenarioDefinition {
  activeScenarioId = scenarioId
  requestSequence = 0
  persistScenario(scenarioId)
  return mockScenarios[scenarioId]
}

export function resetActiveScenario(): MockScenarioDefinition {
  return setActiveScenario(defaultMockScenarioId)
}

export function nextRequestSequence(): number {
  const currentSequence = requestSequence
  requestSequence += 1
  return currentSequence
}
