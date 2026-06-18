/**
 * Contract Utils Tests
 * Demonstrates best practices for testing HTML handling
 *
 * Setup: Ensure jest.config.ts is configured for this test suite
 * Run with: npm test -- contract-utils.test.ts
 *
 * @jest-environment jsdom (for DOMPurify sanitization)
 */

import {
  buildPlaceholderData,
  processContractTemplate,
  replacePlaceholders,
  sanitizeHtml,
} from "@/lib/contract-utils";
import type { IBusinessContract } from "@/types/contract-types";

describe("Contract Utils", () => {
  describe("escapeHtml", () => {
    it("should escape HTML special characters", () => {
      // This tests the internal escapeHtml function indirectly through buildPlaceholderData
      const contract: IBusinessContract = {
        id: "1",
        status: "pending",
        business_name: "<img src=x onerror='alert(1)'>",
        business_business_name: "Test Corp",
        business_designation: "CEO",
        mipal_name: null,
        mipal_designation: null,
        mipal_signature: null,
        mipal_phone: null,
        mipal_email: null,
        mipal_witness_signature: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };

      const placeholders = buildPlaceholderData(contract, null);

      // Should be escaped, not raw HTML
      expect(placeholders.business_name).toContain("&lt;");
      expect(placeholders.business_name).not.toContain("<img");
      expect(placeholders.business_name).toContain("&#39;");
    });

    it("should handle null/undefined values safely", () => {
      const placeholders = buildPlaceholderData(null, null);

      expect(placeholders.business_name).toBe("Business Representative Name");
      expect(placeholders.business_phone).toBe("--------------");
      expect(placeholders.business_email).toBe("--------------");
    });
  });

  describe("replacePlaceholders", () => {
    it("should replace all placeholders with provided data", () => {
      const template = "Business: {{business_name}}, Phone: {{business_phone}}";
      const data = {
        business_name: "ACME Corp",
        business_phone: "555-0123",
        mipal_name: "John",
        mipal_designation: "Manager",
        mipal_phone: "555-4567",
        mipal_email: "john@mypal.com",
        business_business_name: "ACME",
        business_designation: "Owner",
        business_email: "contact@acme.com",
        business_witness_phone: "555-9999",
        business_witness_email: "witness@acme.com",
      };

      const result = replacePlaceholders(template, data);

      expect(result).toBe("Business: ACME Corp, Phone: 555-0123");
    });

    it("should handle missing placeholders gracefully", () => {
      const template = "Name: {{business_name}}, Unknown: {{unknown_field}}";
      const data = {
        business_name: "ACME",
        mipal_name: "John",
        mipal_designation: "Manager",
        mipal_phone: "555-4567",
        mipal_email: "john@mypal.com",
        business_business_name: "ACME",
        business_designation: "Owner",
        business_phone: "555-0123",
        business_email: "contact@acme.com",
        business_witness_phone: "555-9999",
        business_witness_email: "witness@acme.com",
      };

      const result = replacePlaceholders(template, data);

      expect(result).toContain("Name: ACME");
      // Unknown field stays as-is (not in data object)
      expect(result).toContain("{{unknown_field}}");
    });

    it("should handle multiple occurrences of same placeholder", () => {
      const template =
        "First: {{business_name}}, Second: {{business_name}}, Third: {{business_name}}";
      const data = {
        business_name: "ACME",
        mipal_name: "John",
        mipal_designation: "Manager",
        mipal_phone: "555-4567",
        mipal_email: "john@mypal.com",
        business_business_name: "ACME",
        business_designation: "Owner",
        business_phone: "555-0123",
        business_email: "contact@acme.com",
        business_witness_phone: "555-9999",
        business_witness_email: "witness@acme.com",
      };

      const result = replacePlaceholders(template, data);

      expect(result).toBe("First: ACME, Second: ACME, Third: ACME");
    });
  });

  describe("sanitizeHtml", () => {
    it("should remove script tags", () => {
      const malicious =
        "<p>Safe content</p><script>alert('xss')</script><p>More safe</p>";
      const result = sanitizeHtml(malicious);

      expect(result).toContain("<p>Safe content</p>");
      expect(result).toContain("<p>More safe</p>");
      expect(result).not.toContain("script");
      expect(result).not.toContain("alert");
    });

    it("should remove event handlers", () => {
      const malicious = '<img src="image.jpg" onerror="alert(1)" alt="test">';
      const result = sanitizeHtml(malicious);

      expect(result).not.toContain("onerror");
      expect(result).toContain("src=");
      expect(result).toContain("alt=");
    });

    it("should remove data attributes", () => {
      const malicious = '<div data-script="alert(1)">Content</div><p>Safe</p>';
      const result = sanitizeHtml(malicious);

      expect(result).not.toContain("data-script");
      expect(result).toContain("Content");
      expect(result).toContain("<p>Safe</p>");
    });

    it("should allow safe HTML elements", () => {
      const safe =
        "<h1>Title</h1><p>Paragraph</p><ul><li>Item</li></ul><strong>Bold</strong>";
      const result = sanitizeHtml(safe);

      expect(result).toContain("Title");
      expect(result).toContain("Paragraph");
      expect(result).toContain("Item");
      expect(result).toContain("Bold");
    });

    it("should preserve safe links", () => {
      const html = '<a href="https://example.com" target="_blank">Link</a>';
      const result = sanitizeHtml(html);

      expect(result).toContain("href=");
      expect(result).toContain("example.com");
      expect(result).toContain("Link");
    });

    it("should remove javascript protocol", () => {
      const malicious = '<a href="javascript:alert(1)">Click me</a>';
      const result = sanitizeHtml(malicious);

      expect(result).not.toContain("javascript:");
      expect(result).toContain("Click me");
    });
  });

  describe("buildPlaceholderData", () => {
    it("should prioritize contract data over business data", () => {
      const contract: IBusinessContract = {
        id: "1",
        status: "pending",
        business_name: "Contract Corp",
        business_business_name: "Contract Business",
        business_phone: "555-0001",
        mipal_name: null,
        mipal_designation: null,
        mipal_signature: null,
        mipal_phone: null,
        mipal_email: null,
        mipal_witness_signature: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };

      const business = {
        business_name: "Business Corp",
        business_number: "555-9999",
      };

      const placeholders = buildPlaceholderData(contract, business);

      // Contract data should take priority
      expect(placeholders.business_name).toContain("Contract");
      expect(placeholders.business_business_name).toContain("Contract");
    });

    it("should use business data as fallback", () => {
      const business = {
        business_name: "Business Corp",
        business_number: "555-9999",
      };

      const placeholders = buildPlaceholderData(null, business);

      expect(placeholders.business_business_name).toContain("Business");
      expect(placeholders.business_phone).toContain("555-9999");
    });

    it("should use defaults when no data available", () => {
      const placeholders = buildPlaceholderData(null, null);

      expect(placeholders.business_name).toBe("Business Representative Name");
      expect(placeholders.business_phone).toBe("--------------");
    });
  });

  describe("processContractTemplate", () => {
    const validContract: IBusinessContract = {
      id: "1",
      status: "pending",
      business_name: "ACME Corp",
      business_business_name: "ACME Inc.",
      business_designation: "Owner",
      business_phone: "555-0123",
      business_email: "contact@acme.com",
      mipal_name: null,
      mipal_designation: null,
      mipal_signature: null,
      mipal_phone: null,
      mipal_email: null,
      mipal_witness_signature: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      completed_at: null,
    };

    it("should process valid template successfully", () => {
      const template =
        "<p>Contract for {{business_name}} at {{business_phone}}</p>";

      const result = processContractTemplate(template, validContract, null);

      expect(result.isValid).toBe(true);
      expect(result.html).toContain("ACME Corp");
      expect(result.html).toContain("555-0123");
    });

    it("should reject non-string input", () => {
      const result = processContractTemplate(
        123 as unknown as string,
        null,
        null,
      );

      expect(result.isValid).toBe(false);
      expect(result.warning).toBeDefined();
      expect(result.html).toBe("");
    });

    it("should reject empty string", () => {
      const result = processContractTemplate("", validContract, null);

      expect(result.isValid).toBe(false);
      expect(result.warning).toContain("empty");
    });

    it("should handle XSS attempts in placeholders", () => {
      const maliciousContract: IBusinessContract = {
        ...validContract,
        business_name: "<script>alert('xss')</script>",
      };

      const template = "<p>Company: {{business_name}}</p>";

      const result = processContractTemplate(template, maliciousContract, null);

      expect(result.isValid).toBe(true);
      expect(result.html).not.toContain("<script>");
      expect(result.html).toContain("&lt;script&gt;");
    });

    it("should handle XSS attempts in template", () => {
      const template =
        "<p>Safe</p><script>alert('xss')</script><img src=x onerror='alert(1)'>";

      const result = processContractTemplate(template, validContract, null);

      expect(result.isValid).toBe(true);
      expect(result.html).not.toContain("<script>");
      expect(result.html).not.toContain("onerror");
      expect(result.html).toContain("Safe");
    });

    it("should return validation error for oversized content", () => {
      const largeTemplate = "x".repeat(1024 * 1024 + 1);

      const result = processContractTemplate(largeTemplate, null, null);

      expect(result.isValid).toBe(false);
      expect(result.warning).toContain("maximum size");
    });

    it("should handle null contract gracefully", () => {
      const template = "<p>Name: {{business_name}}</p>";

      const result = processContractTemplate(template, null, null);

      expect(result.isValid).toBe(true);
      expect(result.html).toContain("Business Representative Name");
    });

    it("should preserve HTML structure", () => {
      const template = `
        <h1>Contract Title</h1>
        <p>This is for {{business_business_name}}</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <table>
          <tr><td>{{business_name}}</td></tr>
        </table>
      `;

      const result = processContractTemplate(template, validContract, null);

      expect(result.isValid).toBe(true);
      expect(result.html).toContain("Contract Title");
      expect(result.html).toContain("ACME Inc");
      expect(result.html).toContain("Item 1");
      expect(result.html).toContain("Item 2");
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in business name", () => {
      const contract: IBusinessContract = {
        id: "1",
        status: "pending",
        business_name: "O'Reilly & Associates <Inc>",
        business_business_name: "Corp",
        mipal_name: null,
        mipal_designation: null,
        mipal_signature: null,
        mipal_phone: null,
        mipal_email: null,
        mipal_witness_signature: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };

      const template = "<p>{{business_name}}</p>";
      const result = processContractTemplate(template, contract, null);

      expect(result.isValid).toBe(true);
      expect(result.html).toContain("&amp;");
      expect(result.html).not.toContain("<");
      expect(result.html).not.toContain(">");
    });

    it("should handle very long business names", () => {
      const contract: IBusinessContract = {
        id: "1",
        status: "pending",
        business_name: "A".repeat(1000),
        business_business_name: "Corp",
        mipal_name: null,
        mipal_designation: null,
        mipal_signature: null,
        mipal_phone: null,
        mipal_email: null,
        mipal_witness_signature: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };

      const template = "<p>{{business_name}}</p>";
      const result = processContractTemplate(template, contract, null);

      expect(result.isValid).toBe(true);
      expect(result.html).toContain("A".repeat(1000));
    });

    it("should handle unicode characters safely", () => {
      const contract: IBusinessContract = {
        id: "1",
        status: "pending",
        business_name: "Société Générale 日本企業 🏢",
        business_business_name: "Corp",
        mipal_name: null,
        mipal_designation: null,
        mipal_signature: null,
        mipal_phone: null,
        mipal_email: null,
        mipal_witness_signature: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completed_at: null,
      };

      const template = "<p>{{business_name}}</p>";
      const result = processContractTemplate(template, contract, null);

      expect(result.isValid).toBe(true);
      expect(result.html).toContain("Générale");
      expect(result.html).toContain("日本企業");
    });
  });
});
