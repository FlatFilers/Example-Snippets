import {SpaceConfig} from "@flatfile/configure";
import {ExcelExtractor} from "./excel.extractor";

export default new SpaceConfig({
  name: 'your space config',
  workbookConfigs: {}
}).on('file:created', (event) => {
  return new ExcelExtractor(event).runExtraction()
})
