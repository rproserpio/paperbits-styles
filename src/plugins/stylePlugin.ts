import { Style, StylePluginConfig, StyleRule } from "@paperbits/common/styles";
import { ThemeContract } from "../contracts/themeContract";

export abstract class StylePlugin {
    protected name: string;

    public async configToStyleRules?(pluginConfig: StylePluginConfig): Promise<StyleRule[]> {
        return [];
    }

    public async configToNestedStyles?(pluginConfig: StylePluginConfig): Promise<Style[]> {
        return [];
    }

    public async configToPseudoStyles?(pluginConfig: StylePluginConfig): Promise<Style[]> {
        return [];
    }

    private static isStringNumber(value: string): boolean {
        return /^\d*$/gm.test(value);
    }

    public isValueEmpty(value: string | number): boolean {
        return value === null || value === undefined || value === "";
    }

    public parseValue(value: string | number): string {
        if (value === null || value === undefined || value === "") {
            throw new Error(`Style rule value cannot be empty.`);
        }

        if (value === "auto" || value === "initial" || value === "inherit") {
            return value;
        }

        if (typeof value === "number" || StylePlugin.isStringNumber(value)) {
            return value + "px";
        }

        if (typeof value === "string") {
            return value;
        }

        throw new Error(`Unparsable value ${value}.`);
    }

    public setThemeContract?(themeContract: ThemeContract): void;
}