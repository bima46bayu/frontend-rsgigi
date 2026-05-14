import api, { sendRequest, sendPutRequest, sendDeleteRequest } from "@/lib/api"

export const getItems = (params = {}) => {
    return api.get("/items", { params })
}

export const createItem = (data) => {
    return sendRequest("/items", data)
}

export const updateItem = (id, data) => {
    return sendPutRequest(`/items/${id}`, data)
}

export const deleteItem = (id) => {
    return sendDeleteRequest(`/items/${id}`)
}

export const getItemFlow = (id) => {
    return api.get(`/items/${id}/transactions`)
}

export const getItemBatches = (id) => {
    return api.get(`/items/${id}/stocks`)
}

export const adjustStockIn = (id, data) => {
    return sendRequest(`/items/${id}/stock-in`, data)
}

export const adjustStockOut = (id, data) => {
    return sendRequest(`/items/${id}/stock-out`, data)
}

export const exportInventory = async () => {
    const response = await api.get("/export/inventory", {
        responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

export const importItems = (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/items/import", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

export const downloadImportTemplate = async () => {
    const response = await api.get("/items/import/template", {
        responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Template_Import_Barang.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
};
