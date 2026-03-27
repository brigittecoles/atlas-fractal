// packages/atlas-agent/src/data/porter.ts
export interface PorterActivity {
  name: string;
  type: "primary" | "support";
  description: string;
}

export const porterActivities: PorterActivity[] = [
  { name: "Inbound Logistics", type: "primary", description: "Receiving, warehousing, inventory management of raw materials" },
  { name: "Operations", type: "primary", description: "Transforming inputs into finished products or services" },
  { name: "Outbound Logistics", type: "primary", description: "Distributing finished products to customers" },
  { name: "Marketing & Sales", type: "primary", description: "Identifying customer needs and generating sales" },
  { name: "Service", type: "primary", description: "Maintaining and enhancing product value after sale" },
  { name: "Firm Infrastructure", type: "support", description: "General management, planning, finance, legal, government affairs" },
  { name: "Human Resource Management", type: "support", description: "Recruiting, hiring, training, development, compensation" },
  { name: "Technology Development", type: "support", description: "R&D, process automation, technology infrastructure" },
  { name: "Procurement", type: "support", description: "Purchasing inputs, supplier management, vendor relations" },
];
