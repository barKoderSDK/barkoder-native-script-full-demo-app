# barKoder NativeScript Barcode Scanner Plugin

Add native barcode scanning to **NativeScript applications for Android and iOS** with the official barKoder NativeScript plugin. It exposes the barKoder native scanning engine to NativeScript projects, making it possible to build embedded camera-based barcode capture without relying on a separate scanner application or dedicated scanning device.

The plugin is intended for production applications that need reliable decoding of everyday barcode formats and advanced scanning capabilities for demanding logistics, manufacturing, retail, automotive and identity workflows.

## Quick links

- **NativeScript Barcode Scanner SDK:** [https://barkoder.com/barcode-scanner-sdk/frameworks/nativescript](https://barkoder.com/barcode-scanner-sdk/frameworks/nativescript)
- **npm package:** [https://www.npmjs.com/package/barkoder-nativescript](https://www.npmjs.com/package/barkoder-nativescript)
- **Installation guide:** [https://barkoder.com/docs/v1/nativescript/nativescript-installation](https://barkoder.com/docs/v1/nativescript/nativescript-installation)
- **Example:** [https://barkoder.com/docs/v1/nativescript/nativescript-example](https://barkoder.com/docs/v1/nativescript/nativescript-example)
- **API reference:** [https://barkoder.com/docs/v1/nativescript/nativescript-api-reference](https://barkoder.com/docs/v1/nativescript/nativescript-api-reference)
- **Full demo app:** [https://github.com/barKoderSDK/barkoder-native-script-full-demo-app](https://github.com/barKoderSDK/barkoder-native-script-full-demo-app)
- **Free trial:** [https://barkoder.com/trial](https://barkoder.com/trial)

## Key capabilities

barKoder is designed for production barcode capture workflows where speed and decode reliability matter. Depending on the license and configuration, the SDK supports capabilities such as:

- 30+ 1D and 2D barcode symbologies, including QR Code, Data Matrix, PDF417, Code 128, Code 39, EAN/UPC, Aztec, DotCode and GS1 formats
- [Direct Part Marking (DPM) scanning](https://barkoder.com/barcode-scanner-sdk/dpm) for difficult Data Matrix codes on metal, plastic and other industrial surfaces
- [Batch MultiScan](https://barkoder.com/barcode-scanner-sdk/batch-multiscan) for decoding multiple barcodes in a single camera view
- [VIN barcode scanning](https://barkoder.com/barcode-scanner-sdk/vin-scanning) for automotive workflows
- [MRZ scanning](https://barkoder.com/barcode-scanner-sdk/mrz) for passports, ID cards and travel documents
- Continuous scanning, image/gallery scanning and configurable regions of interest
- Advanced decoding for damaged, deformed, low-quality and blurry barcodes
- On-device scanning for normal mobile scanning workflows

For the complete feature set and platform-specific configuration options, use the official documentation linked below.


## Installation

Install the package from npm:

```bash
npm install barkoder-nativescript
```

Complete the Android/iOS project configuration and permissions using the [NativeScript installation guide](https://barkoder.com/docs/v1/nativescript/nativescript-installation).

The plugin exposes barKoder constants and view functionality through the NativeScript package. Use the current [NativeScript example](https://barkoder.com/docs/v1/nativescript/nativescript-example) rather than copying API calls from older starter applications.

## Examples

- [NativeScript integration example](https://barkoder.com/docs/v1/nativescript/nativescript-example)
- [NativeScript API reference](https://barkoder.com/docs/v1/nativescript/nativescript-api-reference)
- [Full NativeScript demo app](https://github.com/barKoderSDK/barkoder-native-script-full-demo-app)

## Trial license

You can evaluate barKoder in your own application with a free trial license:

**[Get a free barKoder SDK trial](https://barkoder.com/trial)**

The SDK can be initialized without a valid license for integration testing, but decoded results may be partially masked or marked as unlicensed. Use a valid trial or production license for complete results and licensed functionality.

Do not publish a trial license in a production application or public source repository.


## Support

Need help with integration or testing?

- Documentation: [https://barkoder.com/docs/v1/home](https://barkoder.com/docs/v1/home)
- Technical support: [support@barkoder.com](mailto:support@barkoder.com)
- Sales and licensing: [sales@barkoder.com](mailto:sales@barkoder.com)

## License

See the `LICENSE` file in this repository for the terms applicable to the repository contents. Use of the barKoder SDK itself is subject to the applicable barKoder license agreement.
