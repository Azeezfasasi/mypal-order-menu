/**
 * Contract Template Utilities
 * Handles dynamic placeholder replacement for contract templates
 * with best practices for HTML sanitization and security
 */

import type { IBusiness } from "@/types/auth-types";
import type { IBusinessContract } from "@/types/contract-types";
import createDOMPurify from "isomorphic-dompurify";

/**
 * Minimal business interface for contract placeholders
 * Works with both IBusiness and IStoredBusiness
 */
export interface IBusinessForContract {
  business_name?: string | null;
  business_number?: string | null;
  email?: string;
}

/**
 * Placeholder values that can be used in contract templates
 */
export interface IContractPlaceholderData {
  // Mypal representative information
  mipal_name?: string;
  mipal_designation?: string;
  mipal_phone?: string;
  mipal_email?: string;

  // Business information (from signed contract or current business)
  business_business_name?: string; // The business company name
  business_business_address?: string; // The business address
  business_name?: string; // Representative's name
  business_designation?: string;
  business_signature?: string;
  business_phone?: string;
  business_email?: string;
  business_witness_phone?: string;
  business_witness_signature?: string;
  business_witness_email?: string;
  // Contract timestamps
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
  // Commission information
  commission_value?: string;

  // Mypal/business signatures (if present in template)
  mipal_signature?: string;
  mipal_witness_signature?: string;
}

/**
 * Result from processing contract template
 * Includes metadata for debugging and logging
 */
export interface IProcessContractResult {
  html: string;
  isValid: boolean;
  warning?: string;
}

/**
 * Default Mypal representative information
 * This can be moved to env variables or fetched from backend
 */
const DEFAULT_MYPAL_INFO = {
  mipal_name: "--------------",
  mipal_designation: "--------------",
  mipal_phone: "--------------",
  mipal_email: "--------------",
};

/**
 * DOMPurify configuration for safe HTML rendering
 * Restricts potentially harmful tags while allowing document structure
 */
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "hr",
    "div",
    "span",
    "section",
    "article",
    "table",
    "thead",
    "tbody",
    "tr",
    "td",
    "th",
    "img",
    "figcaption",
    "figure",
  ],
  ALLOWED_ATTR: [
    "href",
    "title",
    "target",
    "rel",
    "src",
    "alt",
    "width",
    "height",
    "style",
    "class",
  ],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
} as Record<string, unknown>;

/**
 * Escapes plain text to prevent HTML injection
 * Used for user-provided data in placeholders
 */
function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";

  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(text).replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Builds placeholder data from various sources
 * Priority: signed contract data > template data > current business data > defaults
 *
 * @param contract - Signed contract with finalized data
 * @param currentBusiness - Current business profile data
 * @param template - Contract template with commission and model data
 * @returns Placeholder data object with escaped values
 */
export function buildPlaceholderData(
  contract: IBusinessContract | null,
  currentBusiness: IBusinessForContract | IBusiness | null,
  template: { commission_value?: string; commission_model?: string } | null = null,
): IContractPlaceholderData {
  // Helper to safely escape and provide fallback
  const safeValue = (value: string | null | undefined, fallback: string) =>
    escapeHtml(value || fallback);

  return {
    // Mypal information (can be extended to fetch from backend)
    ...DEFAULT_MYPAL_INFO,

    // Business information - use signed contract if available, otherwise current business
    business_business_name: safeValue(
      contract?.business_business_name ||
        currentBusiness?.business_name ||
        null,
      "Your Business Name",
    ),

    business_business_address: safeValue(
      contract?.business_business_address ||
        (currentBusiness && "address" in currentBusiness
          ? (currentBusiness as unknown as Record<string, unknown>).address as string | null
          : null) ||
        null,
      "--------------",
    ),

    business_name: safeValue(contract?.business_name || null, "-----------"),

    business_designation: safeValue(
      contract?.business_designation || null,
      "---------------",
    ),

    business_phone: safeValue(
      contract?.business_phone ||
        (currentBusiness && "business_number" in currentBusiness
          ? currentBusiness.business_number
          : null) ||
        null,
      "--------------",
    ),

    business_email: safeValue(
      contract?.business_email || null,
      "--------------",
    ),
    business_signature: safeValue(
      contract?.business_signature || null,
      "--------------",
    ),

    business_witness_phone: safeValue(
      contract?.business_witness_phone || null,
      "--------------",
    ),
    business_witness_signature: safeValue(
      contract?.business_witness_signature || null,
      "--------------",
    ),

    business_witness_email: safeValue(
      contract?.business_witness_email || null,
      "--------------",
    ),

    // Completed / signed date for the contract (formatted)
    completed_at: safeValue(
      ((): string | null => {
        const dateStr = contract?.completed_at || contract?.created_at || null;
        if (!dateStr) return null;
        try {
          return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          return String(dateStr);
        }
      })(),
      "--------------",
    ),

    // created dates
    created_at: safeValue(
      ((): string | null => {
        const dateStr = contract?.created_at || null;
        if (!dateStr) return null;
        try {
          return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {          return String(dateStr);
        }
      })(),
      "--------------",
    ),

    // Updated date for the contract (formatted)
    updated_at: safeValue(
      ((): string | null => {
        const dateStr = contract?.updated_at || null;
        if (!dateStr) return null;
        try {
          return new Date(dateStr).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          return String(dateStr);
        }
      })(),
      "--------------",
    ),

    // Commission value - check contract first, then template, then fallback
    commission_value: (() => {
      const contractVal = contract?.commission_value;
      const templateVal = template?.commission_value;
      const resolved = safeValue(
        contractVal || templateVal || null,
        "--------------",
      );
      console.log("[Contract Utils] Commission Resolution:", {
        from_contract: contractVal,
        from_template: templateVal,
        final_value: resolved,
      });
      return resolved;
    })(),

    // Mypal placeholders: resolve from contract mipal_* fields (signed contract)
    // fallback to template data or DEFAULT_MYPAL_INFO.
    // NOTE: your UI fetch indicates these should come from the contract object.
    mipal_name: safeValue(contract?.mipal_name ?? null, DEFAULT_MYPAL_INFO.mipal_name),
    mipal_designation: safeValue(
      contract?.mipal_designation ?? null,
      DEFAULT_MYPAL_INFO.mipal_designation,
    ),
    mipal_phone: safeValue(contract?.mipal_phone ?? null, DEFAULT_MYPAL_INFO.mipal_phone),
    mipal_email: safeValue(contract?.mipal_email ?? null, DEFAULT_MYPAL_INFO.mipal_email),

    mipal_signature: safeValue(contract?.mipal_signature ?? null, "--------------"),
    mipal_witness_signature: safeValue(
      contract?.mipal_witness_signature ?? null,
      "--------------",
    ),

  };
}

/**
 * Validates that template content is a string and reasonable size
 * Prevents processing of invalid or suspiciously large content
 *
 * @param templateContent - Content to validate
 * @returns Validation result with optional warning
 */
function validateTemplateContent(templateContent: unknown): {
  isValid: boolean;
  warning?: string;
} {
  if (typeof templateContent !== "string") {
    return {
      isValid: false,
      warning: "Template content must be a string",
    };
  }

  // Reasonable size limit: 1MB for a contract
  const MAX_SIZE = 1024 * 1024;
  if (templateContent.length > MAX_SIZE) {
    return {
      isValid: false,
      warning: `Template content exceeds maximum size (${MAX_SIZE} bytes)`,
    };
  }

  if (templateContent.trim().length === 0) {
    return {
      isValid: false,
      warning: "Template content is empty",
    };
  }

  return { isValid: true };
}

/**
 * Replaces all placeholders in template content with actual values
 * Placeholders format: {{placeholder_name}}
 * Uses escaped values to prevent HTML injection
 * Any remaining placeholders are replaced with "-----"
 *
 * @param templateContent - Template HTML/text with placeholders
 * @param data - Placeholder data (values are already escaped)
 * @returns Content with placeholders replaced
 */
export function replacePlaceholders(
  templateContent: string,
  data: IContractPlaceholderData,
): string {
  let content = templateContent;

  try {
    // Debug: Find all placeholders in the template
    const placeholdersInTemplate = content.match(/\{\{[^}]+\}\}/g) || [];

    // Commission placeholder normalization
    // Goal: make sure any commission-ish placeholders become {{commission_value}}
    // before we do Object.entries(data) replacement.
    const commissionValue = data.commission_value;

    const commissionPlaceholdersFound = placeholdersInTemplate.filter(
      (p) => /commission|comission|cotract|contract/i.test(p),
    );

    content = content
      // contract_commission_value
      .replace(
        /\{\{\s*contract[_-]?commission[_-]?value\s*\}\}/gi,
        "{{commission_value}}",
      )
      // contract_commission
      .replace(
        /\{\{\s*contract[_-]?commission\s*\}\}/gi,
        "{{commission_value}}",
      )
      // commission
      .replace(/\{\{\s*commission\s*\}\}/gi, "{{commission_value}}")
      // cotract comission value (common typo)
      .replace(
        /\{\{\s*cotract\s*comission\s*value\s*\}\}/gi,
        "{{commission_value}}",
      )
      // cotract comission
      .replace(
        /\{\{\s*cotract\s*comission\s*\}\}/gi,
        "{{commission_value}}",
      )
      // comission value
      .replace(
        /\{\{\s*comission\s*value\s*\}\}/gi,
        "{{commission_value}}",
      )
      // already correct
      .replace(/\{\{\s*commission_value\s*\}\}/gi, "{{commission_value}}")
      // generic last resort: anything like {{...commission...}} => commission_value
      .replace(
        /\{\{\s*[^}]*commission[^}]*\}\}/gi,
        "{{commission_value}}",
      );

    console.log("[Contract Utils] Commission normalize debug:", {
      commission_value_resolved: commissionValue,
      commission_placeholders_found_in_raw_template: commissionPlaceholdersFound,
      first_50_after_normalize: content.substring(0, 50),
    });

    // Replace each placeholder with its value
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      const regex = new RegExp(placeholder, "g");
      const count = (content.match(regex) || []).length;
      if (count > 0) {
        console.log("[Contract Utils] Placeholder replace:", {
          placeholder,
          matches: count,
          resolved: value,
        });
        content = content.replace(regex, value || "");
      }
    });

    // Replace any remaining {{...}} placeholders with "-----"
    // This handles cases where placeholders don't have corresponding data
    content = content.replace(/\{\{[^}]+\}\}/g, "-----------");

    return content;
  } catch (error) {
    console.error("[Contract Utils] Error replacing placeholders:", error);
    // Return original content if replacement fails
    return templateContent;
  }
}

/**
 * Sanitizes HTML content using DOMPurify
 * Removes potentially dangerous elements while preserving document structure
 *
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  try {
    // Get window context safely, allowing for server-side rendering
    const windowContext = typeof window !== "undefined" ? window : undefined;

    const DOMPurify = createDOMPurify(windowContext);

    // Apply stricter config for production
    const config =
      process.env.NODE_ENV === "production" ? DOMPURIFY_CONFIG : {};

    return DOMPurify.sanitize(html, config);
  } catch (error) {
    console.warn(
      "[Contract Utils] DOMPurify sanitization failed, returning original HTML:",
      error,
    );
    // Return original content if sanitizer fails
    return html;
  }
}

/**
 * Main function to process contract template with dynamic data
 * Handles placeholder replacement and HTML sanitization
 *
 * @param templateContent - Raw template content from backend
 * @param contract - Signed contract data (optional)
 * @param currentBusiness - Current business profile (optional)
 * @returns Processed HTML and metadata
 *
 * @example
 * const result = processContractTemplate(template.content, contract, business);
 * if (result.isValid) {
 *   return <div dangerouslySetInnerHTML={{ __html: result.html }} />;
 * } else {
 *   return <ErrorMessage warning={result.warning} />;
 * }
 */
export function processContractTemplate(
  templateContent: unknown,
  contract: IBusinessContract | null,
  currentBusiness: IBusinessForContract | IBusiness | null,
  template: { commission_value?: string; commission_model?: string } | null = null,
): IProcessContractResult {
  try {
    // Validate template content
    const validation = validateTemplateContent(templateContent);
    if (!validation.isValid) {
      console.error("[Contract Utils]", validation.warning);
      return {
        html: "",
        isValid: false,
        warning: validation.warning,
      };
    }

    // Safe cast after validation
    const content = templateContent as string;

    // Debug: Check what template content we're working with
    const hasCommissionPlaceholder = content.includes("{{commission_value}}");
    console.log("[Contract Utils] Processing Template:", {
      has_commission_placeholder: hasCommissionPlaceholder,
      content_length: content.length,
      first_500_chars: content.substring(0, 500),
    });

    // Build placeholder data with escaped values, including template commission data
    const placeholderData = buildPlaceholderData(contract, currentBusiness, template);

    // Replace placeholders
    const replaced = replacePlaceholders(content, placeholderData);

    // Sanitize HTML
    const sanitized = sanitizeHtml(replaced);

    return {
      html: sanitized,
      isValid: true,
    };
  } catch (error) {
    console.error("[Contract Utils] Fatal error processing template:", error);
    return {
      html: "",
      isValid: false,
      warning: "Failed to process contract template",
    };
  }
}
