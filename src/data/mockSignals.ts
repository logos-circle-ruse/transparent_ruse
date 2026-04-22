import type { Signal } from "../types";

export const mockSignals: Signal[] = [
  {
    id: "SIG-2026-001",
    title: "Damaged sidewalk near central bus station",
    district: "Center",
    neighborhoodId: "center",
    createdAt: "2026-04-16",
    status: "Pending",
    priority: "High",
    summary:
      "Large broken section of pavement creates a safety hazard for pedestrians and parents with strollers.",
    upvotes: 24,
    downvotes: 1,
    attachments: [],
    communicationTimeline: [
      {
        id: "SIG-2026-001-original",
        eventType: "original_signal",
        actor: "citizen",
        message:
          "Large broken section of pavement creates a safety hazard for pedestrians and parents with strollers.",
        createdAt: "2026-04-16T08:20:00.000Z",
      },
      {
        id: "SIG-2026-001-ai-summary",
        eventType: "ai_summary",
        actor: "ai",
        message:
          "AI summary: Sidewalk damage near the central bus station presents daily safety risk.",
        createdAt: "2026-04-16T08:22:00.000Z",
      },
      {
        id: "SIG-2026-001-submitted",
        eventType: "submitted_to_municipality",
        actor: "system",
        message: "Submission sent to Ruse Municipality public works department.",
        createdAt: "2026-04-16T08:25:00.000Z",
      },
    ],
  },
  {
    id: "SIG-2026-002",
    title: "Street lighting outage on Bulgaria Blvd",
    district: "Vazrazhdane",
    neighborhoodId: "vazrazhdane",
    createdAt: "2026-04-13",
    status: "Resolved",
    priority: "Normal",
    summary:
      "Three consecutive street lights were reported as not functioning for over one week.",
    upvotes: 12,
    downvotes: 0,
    attachments: [],
    communicationTimeline: [
      {
        id: "SIG-2026-002-original",
        eventType: "original_signal",
        actor: "citizen",
        message:
          "Three consecutive street lights were reported as not functioning for over one week.",
        createdAt: "2026-04-13T07:15:00.000Z",
      },
      {
        id: "SIG-2026-002-ai-summary",
        eventType: "ai_summary",
        actor: "ai",
        message:
          "AI summary: Street lighting outage creates low-visibility risk during evening hours.",
        createdAt: "2026-04-13T07:16:00.000Z",
      },
      {
        id: "SIG-2026-002-submitted",
        eventType: "submitted_to_municipality",
        actor: "system",
        message: "Submission sent to the municipal lighting maintenance team.",
        createdAt: "2026-04-13T07:18:00.000Z",
      },
      {
        id: "SIG-2026-002-response",
        eventType: "municipality_response",
        actor: "municipality",
        message:
          "Municipality response: Repair team dispatched and lamps restored within 48 hours.",
        createdAt: "2026-04-14T11:05:00.000Z",
      },
      {
        id: "SIG-2026-002-ai-review",
        eventType: "ai_response_review",
        actor: "ai",
        message: "AI review: Response is satisfactory and includes action plus completion timeline.",
        createdAt: "2026-04-14T11:06:00.000Z",
        satisfactory: true,
      },
    ],
  },
  {
    id: "SIG-2026-003",
    title: "Overflowing public waste containers",
    district: "Druzhba 3",
    neighborhoodId: "druzhba-3",
    createdAt: "2026-04-11",
    status: "No Response",
    priority: "Critical",
    summary:
      "Containers near school entrance have not been emptied regularly, creating poor hygiene conditions.",
    upvotes: 37,
    downvotes: 2,
    attachments: [],
    communicationTimeline: [
      {
        id: "SIG-2026-003-original",
        eventType: "original_signal",
        actor: "citizen",
        message:
          "Containers near school entrance have not been emptied regularly, creating poor hygiene conditions.",
        createdAt: "2026-04-11T10:02:00.000Z",
      },
      {
        id: "SIG-2026-003-ai-summary",
        eventType: "ai_summary",
        actor: "ai",
        message:
          "AI summary: Waste collection delay near school creates hygiene and health concerns.",
        createdAt: "2026-04-11T10:03:00.000Z",
      },
      {
        id: "SIG-2026-003-submitted",
        eventType: "submitted_to_municipality",
        actor: "system",
        message: "Submission sent to municipal sanitation operator.",
        createdAt: "2026-04-11T10:06:00.000Z",
      },
      {
        id: "SIG-2026-003-ai-review",
        eventType: "ai_response_review",
        actor: "ai",
        message:
          "AI review: No municipal response detected yet. Follow-up should request deadline and clear action plan.",
        createdAt: "2026-04-17T09:00:00.000Z",
        satisfactory: false,
      },
    ],
  },
  {
    id: "SIG-2026-004",
    title: "Unsafe pedestrian crossing paint faded",
    district: "Rodina 1",
    neighborhoodId: "rodina-1",
    createdAt: "2026-04-09",
    status: "Pending",
    priority: "High",
    summary:
      "Crosswalk markings are barely visible and drivers do not reduce speed at the intersection.",
    upvotes: 20,
    downvotes: 0,
    attachments: [],
    communicationTimeline: [
      {
        id: "SIG-2026-004-original",
        eventType: "original_signal",
        actor: "citizen",
        message:
          "Crosswalk markings are barely visible and drivers do not reduce speed at the intersection.",
        createdAt: "2026-04-09T13:42:00.000Z",
      },
      {
        id: "SIG-2026-004-ai-summary",
        eventType: "ai_summary",
        actor: "ai",
        message:
          "AI summary: Faded crosswalk paint increases pedestrian accident risk at busy intersection.",
        createdAt: "2026-04-09T13:43:00.000Z",
      },
      {
        id: "SIG-2026-004-submitted",
        eventType: "submitted_to_municipality",
        actor: "system",
        message: "Submission sent to traffic safety and road marking division.",
        createdAt: "2026-04-09T13:45:00.000Z",
      },
    ],
  },
  {
    id: "SIG-2026-005",
    title: "Leaking water pipe in residential street",
    district: "Charodeyka",
    neighborhoodId: "charodeyka",
    createdAt: "2026-04-05",
    status: "Resolved",
    priority: "Normal",
    summary:
      "A persistent water leak affected road conditions and nearby access to building entrances.",
    upvotes: 9,
    downvotes: 1,
    attachments: [],
    communicationTimeline: [
      {
        id: "SIG-2026-005-original",
        eventType: "original_signal",
        actor: "citizen",
        message:
          "A persistent water leak affected road conditions and nearby access to building entrances.",
        createdAt: "2026-04-05T06:50:00.000Z",
      },
      {
        id: "SIG-2026-005-ai-summary",
        eventType: "ai_summary",
        actor: "ai",
        message:
          "AI summary: Infrastructure leak damages street surface and blocks safe building access.",
        createdAt: "2026-04-05T06:52:00.000Z",
      },
      {
        id: "SIG-2026-005-submitted",
        eventType: "submitted_to_municipality",
        actor: "system",
        message: "Submission sent to municipal water utility coordination office.",
        createdAt: "2026-04-05T06:55:00.000Z",
      },
      {
        id: "SIG-2026-005-response",
        eventType: "municipality_response",
        actor: "municipality",
        message:
          "Municipality response: Repair team replaced damaged segment and restored surface.",
        createdAt: "2026-04-06T15:10:00.000Z",
      },
      {
        id: "SIG-2026-005-ai-review",
        eventType: "ai_response_review",
        actor: "ai",
        message: "AI review: Response is satisfactory and includes both action and completion details.",
        createdAt: "2026-04-06T15:11:00.000Z",
        satisfactory: true,
      },
    ],
  },
];
