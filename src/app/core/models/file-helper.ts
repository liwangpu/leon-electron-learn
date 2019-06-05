export class FileHelper {

    /**
     * 获取文件名(包含文件名称和扩展名)
     * 比如从C:\\Users\\Leon\\Desktop\\400x300.png获取400x300.png
     * @param path 
     */
    static getFileName(path: string) {
        if (!path) return;
        let sep = '/';
        if (path.indexOf(sep) == -1)
            sep = "\\";
        let idx = path.lastIndexOf(sep);
        return path.slice(idx + 1, path.length)
    }//getFileName

    /**
     * 获取文件的扩展名,不含点
     * @param path 
     */
    static getFileExt(path: string) {
        let fileName = FileHelper.getFileName(path);
        let idx = fileName.lastIndexOf('.');
        return fileName.slice(idx + 1, fileName.length);
    }
}
