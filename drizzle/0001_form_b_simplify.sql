ALTER TABLE "digital_needs" ALTER COLUMN "need_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "digital_needs" ADD COLUMN "metric_name" varchar(200);--> statement-breakpoint
ALTER TABLE "digital_needs" ADD COLUMN "metric_unit" varchar(64);--> statement-breakpoint
ALTER TABLE "digital_needs" ADD COLUMN "baseline_value" numeric;--> statement-breakpoint
ALTER TABLE "digital_needs" ADD COLUMN "target_value" numeric;