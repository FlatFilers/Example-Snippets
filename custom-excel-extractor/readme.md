# Example Custom File Extractor
This code shows an example of how to setup a custom extractor for any file type and a working example of a customized XLSX extractor.

## Usage

### Install dependencies
```shell
npm install --save xlsx remeda @flatfile/configure @flatfile/api
```

### Copy files
- Copy `abstract.extractor.ts` to your code. This contains some re-useable functions calls for use in extractors.
- Copy `excel.extractor.ts` to your code. This contains logic unique to extracting Excel file data.
  - Review the logic in `convertSheet()` to make sure it makes sense for the type of excel files you're extracting.

### Add event listener to your space configuration

```ts
import { SpaceConfig } from "@flatfile/configure";
import { ExcelExtractor } from "./excel.extractor";

// listen to the upload:completed event
export default new SpaceConfig({
  name: 'your space config',
  workbookConfigs: { /* your configs */ }
}).on('upload:completed', (event) => {
  return new ExcelExtractor(event).runExtraction()
})
```
