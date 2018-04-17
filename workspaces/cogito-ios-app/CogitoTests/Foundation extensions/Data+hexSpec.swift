//  Copyright © 2018 Koninklijke Philips Nederland N.V. All rights reserved.

import Quick
import Nimble

class DataPlusHexSpec: QuickSpec {
    override func spec() {
        it("can initialize from empty string") {
            expect(Data(fromHex: "")?.isEmpty).to(beTrue())
        }

        it("cannot initialize from single character") {
            expect(Data(fromHex: "0")).to(beNil())
        }

        it("can initialize from two characters") {
            expect(Data(fromHex: "ff")) == Data(bytes: [255])
        }

        it("ignores leading 0x") {
            expect(Data(fromHex: "0x")?.isEmpty).to(beTrue())
        }

        it("ignores leading 0x") {
            expect(Data(fromHex: "0xff")) == Data(bytes: [255])
        }

        it("can initialize from longer string") {
            expect(Data(fromHex: "0xFA0db9")) == Data(bytes: [250, 13, 185])
        }
    }
}