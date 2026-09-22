// prompts.ts の JSON Schema風の定義(lowercase type, type:[x,"null"]でnullable表現)を、
// Gemini APIの responseSchema が要求する形式(UPPERCASE type, nullable:trueフィールド)へ変換する。
// この変換ロジックをGeminiプロバイダー内に閉じ込めることで、prompts.ts側のスキーマ定義は
// 特定のAIプロバイダーに依存しない形のまま保てる（将来の他プロバイダー差し替えを容易にする）。

interface JsonSchemaNode {
  type?: string | string[];
  properties?: Record<string, unknown>;
  items?: unknown;
  required?: string[];
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minItems?: number;
  maxItems?: number;
  [key: string]: unknown;
}

const TYPE_MAP: Record<string, string> = {
  object: "OBJECT",
  string: "STRING",
  integer: "INTEGER",
  number: "NUMBER",
  boolean: "BOOLEAN",
  array: "ARRAY",
};

export function toGeminiSchema(node: unknown): unknown {
  if (node === null || typeof node !== "object") return node;
  const schema = node as JsonSchemaNode;
  const result: Record<string, unknown> = {};

  let type = schema.type;
  let nullable = false;
  if (Array.isArray(type)) {
    nullable = type.includes("null");
    type = type.find((t) => t !== "null");
  }
  if (typeof type === "string") {
    result.type = TYPE_MAP[type] ?? type.toUpperCase();
  }
  if (nullable) result.nullable = true;

  if (schema.enum) result.enum = schema.enum;
  if (schema.required) result.required = schema.required;
  if (typeof schema.minimum === "number") result.minimum = schema.minimum;
  if (typeof schema.maximum === "number") result.maximum = schema.maximum;
  if (typeof schema.minItems === "number") result.minItems = schema.minItems;
  if (typeof schema.maxItems === "number") result.maxItems = schema.maxItems;

  if (schema.properties && typeof schema.properties === "object") {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([key, value]) => [key, toGeminiSchema(value)]),
    );
  }
  if (schema.items) {
    result.items = toGeminiSchema(schema.items);
  }

  return result;
}
