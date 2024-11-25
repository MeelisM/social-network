import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Box,
  ImageList,
  ImageListItem,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import giphyService from '../service/giphy';

const GiphyPicker = ({ open, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTrendingGifs();
    }
  }, [open]);

  const loadTrendingGifs = async () => {
    setLoading(true);
    try {
      const trendingGifs = await giphyService.getTrendingGifs();
      setGifs(trendingGifs);
    } catch (error) {
      console.error('Error loading trending gifs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event) => {
    const query = event.target.value;
    setSearch(query);
    
    if (query.trim()) {
      setLoading(true);
      try {
        const searchResults = await giphyService.searchGifs(query);
        setGifs(searchResults);
      } catch (error) {
        console.error('Error searching gifs:', error);
      } finally {
        setLoading(false);
      }
    } else {
      loadTrendingGifs();
    }
  };

  const handleSelect = (gif) => {
    onSelect({
      url: gif.images.original.url,
      width: gif.images.original.width,
      height: gif.images.original.height,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Select a GIF
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search GIFs..."
          value={search}
          onChange={handleSearch}
          sx={{ mb: 2 }}
        />
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <ImageList cols={3} gap={8}>
            {gifs.map((gif) => (
              <ImageListItem 
                key={gif.id}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { opacity: 0.8 }
                }}
                onClick={() => handleSelect(gif)}
              >
                <img
                  src={gif.images.fixed_height.url}
                  alt={gif.title}
                  loading="lazy"
                  style={{ borderRadius: 4 }}
                />
              </ImageListItem>
            ))}
          </ImageList>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GiphyPicker;
