import * as opentype from "opentype.js";
import * as Utils from "@paperbits/common/utils";
import * as Objects from "@paperbits/common/objects";
import { IBlobStorage } from "@paperbits/common/persistence";
import { IconsFontFamilyName, IconsFontFileSourceKey, IconsFontPermalink, IconsFontStyleName } from "../constants";
import { FontContract, FontGlyphContract, ThemeContract } from "../contracts";
import { OpenTypeFont } from "./openTypeFont";
import { OpenTypeFontGlyph } from "./openTypeFontGlyph";


export class FontManager {
    constructor(private readonly blobStorage: IBlobStorage) { }

    private getOpenTypeFont(glyphs: any[]): OpenTypeFont {
        return new opentype.Font({
            familyName: IconsFontFamilyName,
            styleName: IconsFontStyleName,
            unitsPerEm: 400,
            ascender: 800,
            descender: -200,
            glyphs: glyphs
        });
    }

    private getIconFontContract(): FontContract {
        return {
            displayName: "Icons",
            family: IconsFontFamilyName,
            key: "fonts/icons",
            variants: [
                {
                    sourceKey: IconsFontFileSourceKey,
                    permalink: IconsFontPermalink,
                    style: "normal",
                    weight: "400"
                }
            ]
        };
    }

    public async addGlyph(styles: ThemeContract, newGlyph: OpenTypeFontGlyph): Promise<void> {
        let font: OpenTypeFont;
        let iconFont: FontContract = Objects.getObjectAt<FontContract>("fonts/icons", styles);
        const glyphs = [];
        const advanceWidths = []; // capturing advanceWidths (overcoming bug in openfont.js library)

        if (iconFont) {
            const content = await this.blobStorage.downloadBlob(IconsFontFileSourceKey);
            const arrayBuffer = content.buffer.slice(content.byteOffset, content.byteLength + content.byteOffset);

            if (content) {
                font = await opentype.parse(arrayBuffer, null, { lowMemory: true });

                for (let index = 0; index < font.numGlyphs; index++) {
                    const glyphInFont = font.glyphs.get(index);
                    glyphs.push(glyphInFont);
                    advanceWidths.push(glyphInFont.advanceWidth);
                }
            }
        }
        else {
            const notdefGlyph = new opentype.Glyph({
                name: ".notdef",
                unicode: 0,
                advanceWidth: 650,
                path: new opentype.Path()
            });

            glyphs.push(notdefGlyph);
            advanceWidths.push(notdefGlyph.advanceWidth);
        }

        if (!newGlyph.name) {
            newGlyph.name = "Icon";
        }

        glyphs.push(newGlyph);
        advanceWidths.push(newGlyph.advanceWidth);

        font = this.getOpenTypeFont(glyphs);

        // Restoring advanceWidth
        glyphs.forEach((x, index) => x.advanceWidth = advanceWidths[index]);

        const fontArrayBuffer = font.toArrayBuffer();

        await this.blobStorage.uploadBlob(IconsFontFileSourceKey, new Uint8Array(fontArrayBuffer), "font/ttf");

        iconFont = this.getIconFontContract();

        const identifier = Utils.identifier();
        const icon: FontGlyphContract = {
            key: `icons/${identifier}`,
            name: newGlyph.name,
            displayName: newGlyph.name,
            unicode: newGlyph.unicode
        };

        Objects.setValue(`icons/${identifier}`, styles, icon);
        Objects.setValue("fonts/icons", styles, iconFont);
    }

    public async removeGlyph(styles: ThemeContract, unicode: number): Promise<void> {
        let font: OpenTypeFont;
        let iconFont: FontContract = Objects.getObjectAt<FontContract>("fonts/icons", styles);
        const glyphs = [];
        const advanceWidths = []; // capturing advanceWidths (overcoming bug in openfont.js library)

        if (iconFont) {
            const content = await this.blobStorage.downloadBlob(IconsFontFileSourceKey);
            const arrayBuffer = content.buffer.slice(content.byteOffset, content.byteLength + content.byteOffset);

            if (content) {
                font = await opentype.parse(arrayBuffer, null, { lowMemory: true });

                for (let index = 0; index < font.numGlyphs; index++) {
                    const glyphInFont = font.glyphs.get(index);

                    if (glyphInFont.unicode !== unicode) {
                        console.log(glyphInFont.unicode);
                        glyphs.push(glyphInFont);
                        advanceWidths.push(glyphInFont.advanceWidth);
                    }
                }
            }
        }
        else {
            const notdefGlyph = new opentype.Glyph({
                name: ".notdef",
                unicode: 0,
                advanceWidth: 650,
                path: new opentype.Path()
            });

            glyphs.push(notdefGlyph);
            advanceWidths.push(notdefGlyph.advanceWidth);
        }

        font = this.getOpenTypeFont(glyphs);

        // Restoring advanceWidth
        glyphs.forEach((x, index) => x.advanceWidth = advanceWidths[index]);

        const fontArrayBuffer = font.toArrayBuffer();
        await this.blobStorage.uploadBlob(IconsFontFileSourceKey, new Uint8Array(fontArrayBuffer), "font/ttf");

        iconFont = this.getIconFontContract();
        Objects.setValue("fonts/icons", styles, iconFont);
    }
}