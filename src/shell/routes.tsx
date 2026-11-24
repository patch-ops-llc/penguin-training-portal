"use client";

import { useShell } from "@/store/store";
import { EpicorQuoteRecord, EpicorQuotesIndex } from "./pages/epicor-quotes";
import { LeadsPage } from "./pages/leads";
import {
  CompaniesIndex,
  ContactsIndex,
  DealsIndex,
  ProductsIndex,
  QuotesIndex,
  TasksIndex,
  WorkflowsIndex,
} from "./pages/lists";
import { ProfilePage } from "./pages/profile";
import { ProjectRecord, ProjectsIndex } from "./pages/projects";
import { QuotePage } from "./pages/quote";
import { CompanyRecord, ContactRecord, DealRecord } from "./pages/records";
import { SegmentRecord, SegmentsIndex } from "./pages/segments";
import { WorkflowPage } from "./pages/workflow";

export function Routes() {
  const { route } = useShell();
  const [section, id] = route.segments;

  switch (section) {
    case "profile":
      return <ProfilePage />;
    case "contacts":
      return id ? <ContactRecord id={id} /> : <ContactsIndex />;
    case "companies":
      return id ? <CompanyRecord id={id} /> : <CompaniesIndex />;
    case "deals":
      return id ? <DealRecord id={id} /> : <DealsIndex />;
    case "projects":
      return id ? <ProjectRecord id={id} /> : <ProjectsIndex />;
    case "epicor-quotes":
      return id ? <EpicorQuoteRecord id={id} /> : <EpicorQuotesIndex />;
    case "segments":
      return id ? <SegmentRecord id={id} /> : <SegmentsIndex />;
    case "tasks":
      return <TasksIndex />;
    case "leads":
      return <LeadsPage />;
    case "quotes":
      return id ? <QuotePage id={id} /> : <QuotesIndex />;
    case "products":
      return <ProductsIndex />;
    case "workflows":
      return id ? <WorkflowPage id={id} /> : <WorkflowsIndex />;
    default:
      return <DealsIndex />;
  }
}
