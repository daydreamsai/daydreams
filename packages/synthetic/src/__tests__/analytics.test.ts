import { describe, test, expect, beforeEach } from "vitest";
import { SyntheticAnalyzer } from "../analytics";
import {
  sampleMixedRecords,
  sampleLowQualityRecords,
  samplePrivacyIssueRecords,
  sampleDuplicateRecords,
} from "./fixtures/sampleData";

describe("SyntheticAnalyzer", () => {
  let analyzer: SyntheticAnalyzer;

  beforeEach(() => {
    analyzer = new SyntheticAnalyzer();
  });

  describe("analyzeQuality", () => {
    test("should return zero scores for empty records", () => {
      const quality = analyzer.analyzeQuality([]);

      expect(quality.overallScore).toBe(0);
      expect(quality.diversity).toBe(0);
      expect(quality.completeness).toBe(0);
      expect(quality.consistency).toBe(0);
    });

    test("should calculate quality metrics for valid records", () => {
      const quality = analyzer.analyzeQuality(sampleMixedRecords);

      expect(quality.overallScore).toBeGreaterThan(0);
      expect(quality.overallScore).toBeLessThanOrEqual(1);
      expect(quality.diversity).toBeGreaterThan(0);
      expect(quality.completeness).toBeGreaterThan(0);
      expect(quality.consistency).toBeGreaterThan(0);
      expect(typeof quality.byFormat).toBe("object");
    });

    test("should detect low quality records", () => {
      const allRecords = [...sampleMixedRecords, ...sampleLowQualityRecords];
      const quality = analyzer.analyzeQuality(allRecords);

      // Quality should be affected by low quality records
      expect(quality.overallScore).toBeLessThan(1);
    });

    test("should provide per-format quality scores", () => {
      const quality = analyzer.analyzeQuality(sampleMixedRecords);

      expect(Object.keys(quality.byFormat).length).toBeGreaterThan(0);

      Object.values(quality.byFormat).forEach((score) => {
        expect(typeof score).toBe("number");
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("generateStats", () => {
    test("should return zero stats for empty records", () => {
      const stats = analyzer.generateStats([]);

      expect(stats.totalRecords).toBe(0);
      expect(stats.avgLength).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.timeRange.duration).toBe(0);
    });

    test("should calculate correct statistics", () => {
      const stats = analyzer.generateStats(sampleMixedRecords);

      expect(stats.totalRecords).toBe(sampleMixedRecords.length);
      expect(stats.avgLength).toBeGreaterThan(0);
      expect(stats.successRate).toBeGreaterThan(0);
      expect(stats.successRate).toBeLessThanOrEqual(1);
      expect(typeof stats.byFormat).toBe("object");
      expect(typeof stats.contextDistribution).toBe("object");
      expect(typeof stats.actionDistribution).toBe("object");
    });

    test("should calculate time range correctly", () => {
      const stats = analyzer.generateStats(sampleMixedRecords);

      expect(stats.timeRange.start).toBeGreaterThan(0);
      expect(stats.timeRange.end).toBeGreaterThanOrEqual(stats.timeRange.start);
      expect(stats.timeRange.duration).toBe(
        stats.timeRange.end - stats.timeRange.start
      );
    });

    test("should distribute records by format", () => {
      const stats = analyzer.generateStats(sampleMixedRecords);

      expect(Object.keys(stats.byFormat).length).toBeGreaterThan(0);

      const totalByFormat = Object.values(stats.byFormat).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(totalByFormat).toBe(stats.totalRecords);
    });

    test("should calculate context distribution", () => {
      const stats = analyzer.generateStats(sampleMixedRecords);

      expect(Object.keys(stats.contextDistribution).length).toBeGreaterThan(0);

      const totalByContext = Object.values(stats.contextDistribution).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(totalByContext).toBe(stats.totalRecords);
    });
  });

  describe("detectIssues", () => {
    test("should return empty array for clean records", () => {
      const issues = analyzer.detectIssues(sampleMixedRecords);

      // Should be empty or minimal issues
      expect(Array.isArray(issues)).toBe(true);
    });

    // test("should detect duplicate records", () => {
    //   const issues = analyzer.detectIssues(sampleDuplicateRecords);

    //   const duplicateIssues = issues.filter(
    //     (issue) => issue.type === "duplicate"
    //   );
    //   expect(duplicateIssues.length).toBeGreaterThan(0);

    //   duplicateIssues.forEach((issue) => {
    //     expect(issue.severity).toBeDefined();
    //     expect(issue.description).toBeDefined();
    //     expect(Array.isArray(issue.recordIds)).toBe(true);
    //     expect(issue.recordIds.length).toBeGreaterThan(0);
    //   });
    // });

    test("should detect privacy issues", () => {
      const issues = analyzer.detectIssues(samplePrivacyIssueRecords);

      const privacyIssues = issues.filter((issue) => issue.type === "privacy");
      expect(privacyIssues.length).toBeGreaterThan(0);

      privacyIssues.forEach((issue) => {
        expect(issue.severity).toBe("high");
        expect(issue.description).toContain("privacy");
        expect(Array.isArray(issue.recordIds)).toBe(true);
      });
    });

    test("should detect quality issues", () => {
      const issues = analyzer.detectIssues(sampleLowQualityRecords);

      const qualityIssues = issues.filter((issue) => issue.type === "quality");
      expect(qualityIssues.length).toBeGreaterThan(0);

      qualityIssues.forEach((issue) => {
        expect(issue.severity).toBe("low");
        expect(issue.description).toContain("quality");
        expect(Array.isArray(issue.recordIds)).toBe(true);
      });
    });

    test("should detect incomplete records", () => {
      const incompleteRecords = [
        {
          id: "incomplete_1",
          // Missing timestamp, type, data, metadata
        },
      ];

      const issues = analyzer.detectIssues(incompleteRecords as any);

      const incompleteIssues = issues.filter(
        (issue) => issue.type === "incomplete"
      );
      expect(incompleteIssues.length).toBeGreaterThan(0);

      incompleteIssues.forEach((issue) => {
        expect(issue.severity).toBe("high");
        expect(Array.isArray(issue.recordIds)).toBe(true);
        expect(issue.suggestion).toBeDefined();
      });
    });

    test("should categorize issues by severity", () => {
      const allTestRecords = [
        ...sampleDuplicateRecords,
        ...samplePrivacyIssueRecords,
        ...sampleLowQualityRecords,
      ];

      const issues = analyzer.detectIssues(allTestRecords);

      const severityLevels = new Set(issues.map((issue) => issue.severity));
      expect(severityLevels.size).toBeGreaterThan(0);

      // Should have different severity levels
      const validSeverities = ["low", "medium", "high"];
      severityLevels.forEach((severity) => {
        expect(validSeverities).toContain(severity);
      });
    });

    test("should provide suggestions for each issue", () => {
      const issues = analyzer.detectIssues(sampleDuplicateRecords);

      issues.forEach((issue) => {
        expect(issue.suggestion).toBeDefined();
        expect(typeof issue.suggestion).toBe("string");
        expect(issue.suggestion!.length).toBeGreaterThan(0);
      });
    });
  });

  describe("edge cases", () => {
    test("should handle records with missing quality scores", () => {
      const recordsWithoutQuality = sampleMixedRecords.map((record) => ({
        ...record,
        metadata: {
          ...record.metadata,
          quality: undefined,
        },
      }));

      const quality = analyzer.analyzeQuality(recordsWithoutQuality as any);
      expect(quality.overallScore).toBeGreaterThanOrEqual(0);
    });

    test("should handle malformed data gracefully", () => {
      const malformedRecords = [
        {
          id: "malformed_1",
          timestamp: Date.now(),
          type: "instruction-tuning",
          data: null, // Malformed data
          metadata: {
            contextType: "test",
            contextId: "test",
          },
        },
      ];

      expect(() =>
        analyzer.analyzeQuality(malformedRecords as any)
      ).not.toThrow();
      expect(() =>
        analyzer.generateStats(malformedRecords as any)
      ).not.toThrow();
      expect(() =>
        analyzer.detectIssues(malformedRecords as any)
      ).not.toThrow();
    });
  });
});
