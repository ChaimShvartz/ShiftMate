import { supabase } from "../db/index.js";

export function createSupabaseRepo(tableName) {
    async function getAllDocs(filter = {}) {
        let query = supabase.from(tableName).select("*");
        for (const [key, val] of Object.entries(filter)) {
            query = query.eq(key, val);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    async function getDocByField(field, value) {
        const { data, error } = await supabase
            .from(tableName)
            .select("*")
            .eq(field, value)
            .maybeSingle();
        if (error) throw error;
        return data;
    }

    async function createDoc(doc) {
        const { data, error } = await supabase
            .from(tableName)
            .insert(doc)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async function updateDoc(field, value, updates) {
        const { data, error } = await supabase
            .from(tableName)
            .update(updates)
            .eq(field, value)
            .select()
            .single();
        if (error) throw error;
        return data;
    }

    async function deleteDoc(field, value) {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq(field, value);
        if (error) throw error;
        return true;
    }

    async function countDocs(filter = {}) {
        let query = supabase.from(tableName).select("*", { count: "exact", head: true });
        for (const [key, val] of Object.entries(filter)) {
            query = query.eq(key, val);
        }
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
    }

    return {
        getAllDocs,
        getDocByField,
        createDoc,
        updateDoc,
        deleteDoc,
        countDocs,
    };
}
