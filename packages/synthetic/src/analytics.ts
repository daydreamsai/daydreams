import type {
  SyntheticRecord,
  SyntheticFormat,
  SyntheticAnalytics as ISyntheticAnalytics,
  QualityMetrics,
  DatasetStats,
  DataIssue,
} from "./types";

/**
 * Analytics for assessing synthetic data quality and generating insights
 */
export class SyntheticAnalyzer implements ISyntheticAnalytics {
  analyzeQuality(records: SyntheticRecord[]): QualityMetrics {
    if (records.length === 0) {
      return {
        overallScore: 0,
        diversity: 0,
        completeness: 0,
        consistency: 0,
        byFormat: {} as Record<SyntheticFormat, number>,
      };
    }

    const diversity = this.calculateDiversity(records);
    const completeness = this.calculateCompleteness(records);
    const consistency = this.calculateConsistency(records);
    const byFormat = this.calculateFormatQuality(records);

    // Factor in individual record quality scores
    const qualityScores = records
      .map((r) => r.metadata.quality)
      .filter((q): q is number => typeof q === "number");

    const avgIndividualQuality =
      qualityScores.length > 0
        ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length
        : 0.5; // Default if no quality scores

    // Weight overall score with individual quality
    const overallScore =
      (diversity + completeness + consistency + avgIndividualQuality) / 4;

    return {
      overallScore: Math.round(overallScore * 100) / 100,
      diversity: Math.round(diversity * 100) / 100,
      completeness: Math.round(completeness * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      byFormat,
    };
  }

  generateStats(records: SyntheticRecord[]): DatasetStats {
    if (records.length === 0) {
      return {
        totalRecords: 0,
        byFormat: {} as Record<SyntheticFormat, number>,
        avgLength: 0,
        timeRange: { start: 0, end: 0, duration: 0 },
        contextDistribution: {},
        actionDistribution: {},
        successRate: 0,
      };
    }

    const timestamps = records.map((r) => r.timestamp).sort((a, b) => a - b);
    const timeRange = {
      start: timestamps[0],
      end: timestamps[timestamps.length - 1],
      duration: timestamps[timestamps.length - 1] - timestamps[0],
    };

    const byFormat = this.getFormatDistribution(records);
    const contextDistribution = this.getContextDistribution(records);
    const actionDistribution = this.getActionDistribution(records);
    const avgLength = this.calculateAverageLength(records);
    const successRate = this.calculateSuccessRate(records);

    return {
      totalRecords: records.length,
      byFormat,
      avgLength,
      timeRange,
      contextDistribution,
      actionDistribution,
      successRate,
    };
  }

  detectIssues(records: SyntheticRecord[]): DataIssue[] {
    const issues: DataIssue[] = [];

    // Check for duplicates
    const duplicates = this.findDuplicates(records);
    if (duplicates.length > 0) {
      issues.push({
        type: "duplicate",
        severity: "medium",
        description: `Found ${duplicates.length} duplicate records`,
        recordIds: duplicates,
        suggestion: "Remove duplicate records to improve data quality",
      });
    }

    // Check for incomplete records
    const incomplete = this.findIncompleteRecords(records);
    if (incomplete.length > 0) {
      issues.push({
        type: "incomplete",
        severity: "high",
        description: `Found ${incomplete.length} incomplete records`,
        recordIds: incomplete,
        suggestion: "Remove or fix incomplete records",
      });
    }

    // Check for invalid data
    const invalid = this.findInvalidRecords(records);
    if (invalid.length > 0) {
      issues.push({
        type: "invalid",
        severity: "high",
        description: `Found ${invalid.length} invalid records`,
        recordIds: invalid,
        suggestion: "Validate and fix invalid data structures",
      });
    }

    // Check for potential privacy issues
    const privacyIssues = this.findPrivacyIssues(records);
    if (privacyIssues.length > 0) {
      issues.push({
        type: "privacy",
        severity: "high",
        description: `Found ${privacyIssues.length} records with potential privacy issues`,
        recordIds: privacyIssues,
        suggestion: "Apply privacy filters to redact sensitive information",
      });
    }

    // Check for quality issues
    const qualityIssues = this.findQualityIssues(records);
    if (qualityIssues.length > 0) {
      issues.push({
        type: "quality",
        severity: "low",
        description: `Found ${qualityIssues.length} records with quality issues`,
        recordIds: qualityIssues,
        suggestion: "Review and improve low-quality records",
      });
    }

    return issues;
  }

  private calculateDiversity(records: SyntheticRecord[]): number {
    // Measure diversity based on unique contexts, formats, and content variety
    const contexts = new Set(records.map((r) => r.metadata.contextType));
    const formats = new Set(records.map((r) => r.type));
    const contentHashes = new Set(records.map((r) => this.hashContent(r.data)));

    // Calculate diversity score
    const contextDiversity = contexts.size / Math.max(1, records.length * 0.1);
    const formatDiversity = formats.size / 6; // Max possible formats
    const contentDiversity = contentHashes.size / records.length;

    return Math.min(
      1,
      (contextDiversity + formatDiversity + contentDiversity) / 3
    );
  }

  private calculateCompleteness(records: SyntheticRecord[]): number {
    let completeRecords = 0;

    for (const record of records) {
      let score = 0;

      // Check required fields
      if (record.id) score += 0.2;
      if (record.timestamp) score += 0.2;
      if (record.type) score += 0.2;
      if (record.data) score += 0.2;
      if (record.metadata && record.metadata.contextType) score += 0.2;

      if (score >= 0.8) completeRecords++;
    }

    return completeRecords / records.length;
  }

  private calculateConsistency(records: SyntheticRecord[]): number {
    // Check format consistency and data structure consistency
    const formatGroups = this.groupByFormat(records);
    let consistencyScore = 0;

    for (const [format, formatRecords] of Object.entries(formatGroups)) {
      const consistency = this.checkFormatConsistency(
        formatRecords as SyntheticRecord[],
        format as SyntheticFormat
      );
      consistencyScore +=
        consistency * (formatRecords as SyntheticRecord[]).length;
    }

    return consistencyScore / records.length;
  }

  private calculateFormatQuality(
    records: SyntheticRecord[]
  ): Record<SyntheticFormat, number> {
    const formatGroups = this.groupByFormat(records);
    const quality: Record<string, number> = {};

    for (const [format, formatRecords] of Object.entries(formatGroups)) {
      const recordArray = formatRecords as SyntheticRecord[];
      quality[format] = this.assessFormatQuality(
        recordArray,
        format as SyntheticFormat
      );
    }

    return quality as Record<SyntheticFormat, number>;
  }

  private getFormatDistribution(
    records: SyntheticRecord[]
  ): Record<SyntheticFormat, number> {
    const distribution: Record<string, number> = {};

    for (const record of records) {
      distribution[record.type] = (distribution[record.type] || 0) + 1;
    }

    return distribution as Record<SyntheticFormat, number>;
  }

  private getContextDistribution(
    records: SyntheticRecord[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const record of records) {
      const context = record.metadata.contextType;
      distribution[context] = (distribution[context] || 0) + 1;
    }

    return distribution;
  }

  private getActionDistribution(
    records: SyntheticRecord[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const record of records) {
      if (
        record.type === "action-sequences" &&
        record.data &&
        typeof record.data === "object" &&
        "actions" in record.data
      ) {
        const actions = (record.data as any).actions;
        if (Array.isArray(actions)) {
          for (const action of actions) {
            if (action.name) {
              distribution[action.name] = (distribution[action.name] || 0) + 1;
            }
          }
        }
      }
    }

    return distribution;
  }

  private calculateAverageLength(records: SyntheticRecord[]): number {
    const totalLength = records.reduce((sum, record) => {
      return sum + JSON.stringify(record.data).length;
    }, 0);

    return Math.round(totalLength / records.length);
  }

  private calculateSuccessRate(records: SyntheticRecord[]): number {
    const successfulRecords = records.filter(
      (r) => r.metadata.success !== false
    );
    return successfulRecords.length / records.length;
  }

  private findDuplicates(records: SyntheticRecord[]): string[] {
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const record of records) {
      const hash = this.hashContent(record.data);
      if (seen.has(hash)) {
        duplicates.push(record.id);
      } else {
        seen.add(hash);
      }
    }

    return duplicates;
  }

  private findIncompleteRecords(records: SyntheticRecord[]): string[] {
    return records
      .filter(
        (record) => !record.id || !record.data || !record.metadata?.contextType
      )
      .map((record) => record.id || "unknown");
  }

  private findInvalidRecords(records: SyntheticRecord[]): string[] {
    return records
      .filter((record) => {
        try {
          JSON.stringify(record.data);
          return false;
        } catch {
          return true;
        }
      })
      .map((record) => record.id || "unknown");
  }

  private findPrivacyIssues(records: SyntheticRecord[]): string[] {
    const privacyPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone number
      /\b\d{16}\b/, // Credit card-like numbers
      /password|secret|token|key/i, // Sensitive keywords
    ];

    return records
      .filter((record) => {
        const content = JSON.stringify(record.data);
        return privacyPatterns.some((pattern) => pattern.test(content));
      })
      .map((record) => record.id);
  }

  private findQualityIssues(records: SyntheticRecord[]): string[] {
    return records
      .filter((record) => {
        const quality = record.metadata?.quality || 0;
        return quality < 0.5;
      })
      .map((record) => record.id);
  }

  private groupByFormat(
    records: SyntheticRecord[]
  ): Record<string, SyntheticRecord[]> {
    const groups: Record<string, SyntheticRecord[]> = {};

    for (const record of records) {
      if (!groups[record.type]) {
        groups[record.type] = [];
      }
      groups[record.type].push(record);
    }

    return groups;
  }

  private checkFormatConsistency(
    records: SyntheticRecord[],
    format: SyntheticFormat
  ): number {
    // Check if all records of the same format have consistent structure
    if (records.length === 0) return 1;

    const firstRecord = records[0];
    const firstKeys = Object.keys(firstRecord.data || {}).sort();

    let consistentRecords = 0;
    for (const record of records) {
      const keys = Object.keys(record.data || {}).sort();
      if (JSON.stringify(keys) === JSON.stringify(firstKeys)) {
        consistentRecords++;
      }
    }

    return consistentRecords / records.length;
  }

  private assessFormatQuality(
    records: SyntheticRecord[],
    format: SyntheticFormat
  ): number {
    if (records.length === 0) return 0;

    let totalQuality = 0;
    for (const record of records) {
      totalQuality += this.assessRecordQuality(record, format);
    }

    return totalQuality / records.length;
  }

  private assessRecordQuality(
    record: SyntheticRecord,
    format: SyntheticFormat
  ): number {
    let score = 0.5; // Base score

    // Format-specific quality checks
    switch (format) {
      case "instruction-tuning":
        if (record.data && typeof record.data === "object") {
          const data = record.data as any;
          if (data.instruction && data.response) score += 0.3;
          if (data.instruction?.length > 10 && data.response?.length > 20)
            score += 0.2;
        }
        break;

      case "conversation":
        if (record.data && typeof record.data === "object") {
          const data = record.data as any;
          if (
            data.messages &&
            Array.isArray(data.messages) &&
            data.messages.length >= 2
          )
            score += 0.3;
          if (data.messages?.every((m: any) => m.role && m.content))
            score += 0.2;
        }
        break;

      case "reasoning-chains":
        if (record.data && typeof record.data === "object") {
          const data = record.data as any;
          if (
            data.reasoning &&
            Array.isArray(data.reasoning) &&
            data.reasoning.length >= 2
          )
            score += 0.3;
          if (data.problem && data.conclusion) score += 0.2;
        }
        break;

      case "action-sequences":
        if (record.data && typeof record.data === "object") {
          const data = record.data as any;
          if (
            data.actions &&
            Array.isArray(data.actions) &&
            data.actions.length > 0
          )
            score += 0.3;
          if (data.situation && data.outcome) score += 0.2;
        }
        break;

      case "episodes":
        if (record.data && typeof record.data === "object") {
          const data = record.data as any;
          if (data.observation && data.result) score += 0.3;
          if (
            data.thoughts &&
            Array.isArray(data.thoughts) &&
            data.thoughts.length > 0
          )
            score += 0.2;
        }
        break;

      case "grpo":
        if (record.data && typeof record.data === "object") {
          const data = record.data as any;
          if (data.prompt && data.responses && Array.isArray(data.responses)) {
            score += 0.2;

            // Check if we have multiple responses for preference learning
            if (data.responses.length >= 2) score += 0.2;

            // Check if responses have proper rankings
            if (
              data.responses.every(
                (r: any) =>
                  typeof r.rank === "number" && typeof r.score === "number"
              )
            ) {
              score += 0.2;
            }

            // Check for preference comparisons
            if (
              data.comparisons &&
              Array.isArray(data.comparisons) &&
              data.comparisons.length > 0
            ) {
              score += 0.1;
            }

            // Check score diversity (good for GRPO training)
            const scores = data.responses.map((r: any) => r.score);
            const maxScore = Math.max(...scores);
            const minScore = Math.min(...scores);
            if (maxScore - minScore > 0.3) score += 0.1;
          }
        }
        break;
    }

    return Math.min(score, 1.0);
  }

  private hashContent(data: any): string {
    // Simple hash function for content deduplication
    try {
      const str = JSON.stringify(data) || "null";
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString();
    } catch (error) {
      // Fallback for circular references or other JSON.stringify errors
      return `error_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
}
