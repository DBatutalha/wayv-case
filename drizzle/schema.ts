import {
  pgTable,
  serial,
  text,
  numeric,
  timestamp,
  uuid,
  integer,
} from "drizzle-orm/pg-core";

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  budget: numeric("budget"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
});

export const influencers = pgTable("influencers", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id").notNull(),
  name: text("name").notNull(),
  followerCount: integer("follower_count").notNull().default(0),
  engagementRate: numeric("engagement_rate", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
});

export const campaignInfluencers = pgTable("campaign_influencers", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  influencerId: integer("influencer_id")
    .notNull()
    .references(() => influencers.id, { onDelete: "cascade" }),
});
