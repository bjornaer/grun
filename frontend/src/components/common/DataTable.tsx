import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    TableSortLabel,
    Paper,
    Box,
    TextField,
    InputAdornment,
    CircularProgress,
    Typography,
    Checkbox,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Search,
    Refresh,
    FilterList,
    GetApp,
} from '@mui/icons-material';

interface Column<T> {
    id: keyof T;
    label: string;
    minWidth?: number;
    align?: 'right' | 'left' | 'center';
    format?: (value: any) => string;
    sortable?: boolean;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    error?: string;
    selectable?: boolean;
    onSelectionChange?: (selectedIds: string[]) => void;
    onRefresh?: () => void;
    onExport?: () => void;
    onSearch?: (searchTerm: string) => void;
    onSort?: (column: keyof T, direction: 'asc' | 'desc') => void;
    getRowId: (row: T) => string;
    emptyMessage?: string;
}

function DataTable<T>({
    columns,
    data,
    loading = false,
    error,
    selectable = false,
    onSelectionChange,
    onRefresh,
    onExport,
    onSearch,
    onSort,
    getRowId,
    emptyMessage = 'No data available',
}: DataTableProps<T>) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [selected, setSelected] = useState<string[]>([]);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);
        setPage(0);
        if (onSearch) {
            onSearch(value);
        }
    };

    const handleSort = (column: keyof T) => {
        const isAsc = sortColumn === column && sortDirection === 'asc';
        const newDirection = isAsc ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        if (onSort) {
            onSort(column, newDirection);
        }
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const newSelected = data.map(row => getRowId(row));
            setSelected(newSelected);
            if (onSelectionChange) {
                onSelectionChange(newSelected);
            }
        } else {
            setSelected([]);
            if (onSelectionChange) {
                onSelectionChange([]);
            }
        }
    };

    const handleSelectRow = (id: string) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        setSelected(newSelected);
        if (onSelectionChange) {
            onSelectionChange(newSelected);
        }
    };

    const isSelected = (id: string) => selected.indexOf(id) !== -1;

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />
                <Box sx={{ flexGrow: 1 }} />
                {onRefresh && (
                    <Tooltip title="Refresh">
                        <IconButton onClick={onRefresh} disabled={loading}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                )}
                {onExport && (
                    <Tooltip title="Export">
                        <IconButton onClick={onExport} disabled={loading}>
                            <GetApp />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            <TableContainer>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            {selectable && (
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        indeterminate={selected.length > 0 && selected.length < data.length}
                                        checked={data.length > 0 && selected.length === data.length}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                            )}
                            {columns.map((column) => (
                                <TableCell
                                    key={String(column.id)}
                                    align={column.align}
                                    style={{ minWidth: column.minWidth }}
                                >
                                    {column.sortable ? (
                                        <TableSortLabel
                                            active={sortColumn === column.id}
                                            direction={sortColumn === column.id ? sortDirection : 'asc'}
                                            onClick={() => handleSort(column.id)}
                                        >
                                            {column.label}
                                        </TableSortLabel>
                                    ) : (
                                        column.label
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (selectable ? 1 : 0)}
                                    align="center"
                                >
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : error ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (selectable ? 1 : 0)}
                                    align="center"
                                >
                                    <Typography color="error">{error}</Typography>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (selectable ? 1 : 0)}
                                    align="center"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row) => {
                                    const isItemSelected = isSelected(getRowId(row));
                                    return (
                                        <TableRow
                                            hover
                                            key={getRowId(row)}
                                            selected={isItemSelected}
                                        >
                                            {selectable && (
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={isItemSelected}
                                                        onChange={() => handleSelectRow(getRowId(row))}
                                                    />
                                                </TableCell>
                                            )}
                                            {columns.map((column) => {
                                                const value = row[column.id];
                                                return (
                                                    <TableCell key={String(column.id)} align={column.align}>
                                                        {column.format ? column.format(value) : value}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    );
                                })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={[10, 25, 100]}
                component="div"
                count={data.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
}

export default DataTable; 